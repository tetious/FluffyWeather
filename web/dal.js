require('./utils');
var pg = require('pg'),
    sql = require('sql-bricks'),
    _ = require('underscore'),
    redis = require('redis');

var DataAccess = function (config) {
    this.client = new pg.Client(config);
    this.redisClient = redis.createClient(6379, config.redisHost);
    this.client.connect();
    this.instantListKey = "instants";
    this.snapshotKey = "snapshot";
    this.lastUpdate = null;
};

DataAccess.prototype.getLatestUpdate = function(cb) {
    var self = this;

    var latest = {};
    this.redisClient.lindex(this.instantListKey, 0, function(e, update) {
        latest.latest = JSON.parse(update);
        self.redisClient.get(self.snapshotKey, function(e, snapshot) {
            latest.snapshot = JSON.parse(snapshot);
            cb(latest);
        })
    });
};

DataAccess.prototype.processLatestUpdate = function(update) {
    var self = this;
    var now = new Date();

    this.redisClient.get(this.snapshotKey, function(e, snapshot){
        snapshot = self.createReadings([JSON.stringify(update)], JSON.parse(snapshot));
        if(snapshot.last_update && snapshot.last_update.getDay() != now.getDay()) {
            snapshot = {};
        }

        snapshot.last_update = new Date();
        self.redisClient.set(self.snapshotKey, JSON.stringify(snapshot));
    });
};

DataAccess.prototype.getLastUpdate = function() {
    var self = this;

    if(!this.lastUpdate) {
        this.redisClient.lindex(this.instantListKey, 0, function(e, update) {
            if(update) {
                self.lastUpdate = JSON.parse(update);
            }
            return update;
        });
    } else {
        return self.lastUpdate;
    }
};

DataAccess.prototype.insertWeatherUpdate = function(rawWeatherUpdate) {

    if(rawWeatherUpdate.match(/^\[.*\]$/)){
        return console.log("Skipping incomplete frame: "+ rawWeatherUpdate);
    }

    var update = {};
    var updates = rawWeatherUpdate.replace(/(\[|\])/g, '').split('&');
    // [ms=6703026&ri=0.00&ws=1.49&wd=180&t=30.52&p=623.52&h=59.09&v=3400]
    if(updates.length != 8) {
        return console.warn("Skipping frame with missing elements." + rawWeatherUpdate);
    }

    updates.forEach(function (item) {
        var splitItem = item.split('=');
        update[splitItem[0]] = splitItem[1];
    });

    var now = new Date();
    var lastUpdate = this.getLastUpdate();
    if(lastUpdate && now.getMinutes() != lastUpdate.added.getMinutes()) {
        console.log("Saving reading to pgsql.");
        this.insertReading();
    }

    var clampedHumidity = parseFloat(update['h']);
    var parsed = {
        rainfall: parseFloat(update['ri']),
        wind_speed: parseFloat(update['ws']),
        wind_direction: parseFloat(update['wd']),
        temperature: parseFloat(update['t']),
        pressure: parseFloat(update['p']),
        humidity: parseFloat(clampedHumidity > 100 ? 100 : clampedHumidity),
        voltage: parseInt(update['v']),
        uptime: parseInt(update['ms']),
        added: new Date()
    };

    console.log(rawWeatherUpdate);
    this.cleanupFrame(parsed);
    var jsonParsed = JSON.stringify(parsed);

    console.log(jsonParsed);
    this.lastUpdate = parsed;
    this.processLatestUpdate(parsed);
    this.redisClient.lpush(this.instantListKey, jsonParsed);
};

DataAccess.prototype.cleanupFrame = function(parsed) {
    if(parsed.temperature > 60 || parsed.humidity > 100) {
        delete parsed.temperature;
        delete parsed.humidity;
    }

    if(parsed.pressure === null || parsed.pressure < 0) {
        delete parsed.pressure;
    }
};

DataAccess.prototype.createReadings = function(instants, reading) {
    if(!reading) reading = {};
    instants.forEach(function(update) {
        var weatherUpdate = JSON.parse(update);
        _.pairs(_.omit(weatherUpdate, ['added','uptime'])).forEach(function(pair) {
            var datapoint = pair[0], v = pair[1];
            if(!reading[datapoint]) reading[datapoint] = {high: 0.0, low: v, mean: 0.0, total: 0.0,
                instant_count: instants.length, updated_on: weatherUpdate.added.toUTCString(), reading_name: datapoint};

            if(instants.length == 1) reading[datapoint].instant_count++;

            if(v > reading[datapoint].high) reading[datapoint].high = v;
            if(v < reading[datapoint].low) reading[datapoint].low = v;
            reading[datapoint].total +=v;
        });
    });

    // set the mean on all the readings
    _.values(reading).forEach(function(r) {
        r.total = Math.roundFour(r.total);
        r.mean = Math.roundFour(r.total / r.instant_count);
    });

    return reading;
};

DataAccess.prototype.insertReading = function() {
    var reading = {};
    var self = this;
    console.log("Starting PGSQL insert.");

    // we need to turn the list of updates into a list of readings, one per data point
    this.redisClient.lrange(this.instantListKey, 0, -1, function(err, instants){
        reading = self.createReadings(instants);
    });

    _.values(reading).forEach(function(r) {
        this.runQuery(sql.insert('reading', r));
    }, this);

    console.log("Clearing list.");
    this.redisClient.del(this.instantListKey);
    console.log("PGSQL insert complete.");
};

DataAccess.prototype.runQuery = function(sql, resultCallback)  {
    var query = this.client.query(sql.toString(), resultCallback);

    query.on('error', function(err) {
        console.error('PGSQL: Error running query.', err);
    });
};

module.exports = DataAccess;
