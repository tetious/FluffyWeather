require('./utils');
var pg = require('pg'),
    sql = require('sql-bricks'),
    _ = require('underscore'),
    redis = require('redis');

var DataAccess = function (config) {
    this.client = new pg.Client(config);
    this.redisClient = redis.createClient(6379, config.host);
    this.client.connect();
    this.instantListKey = "instants";
    this.lastUpdate = null;
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
}

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

    var parsed = {
        rainfall: parseFloat(update['ri']),
        wind_speed: parseFloat(update['ws']),
        wind_direction: parseFloat(update['wd']),
        temperature: parseFloat(update['t']),
        pressure: parseFloat(update['p']),
        humidity: parseFloat(update['h']),
        voltage: parseInt(update['v']),
        added: new Date()
    };

    var jsonParsed = JSON.stringify(parsed);
    console.log(jsonParsed);
    this.lastUpdate = parsed;
    this.redisClient.lpush(this.instantListKey, jsonParsed);
};

DataAccess.prototype.insertReading = function() {
    var reading = {};
    var now = new Date();
    console.log("Starting PGSQL insert.");

    // we need to turn the list of updates into a list of readings, one per data point
    this.redisClient.lrange(this.instantListKey, 0, -1, function(err, instants){
        instants.forEach(function(update) {
            var weatherUpdate = JSON.parse(update);
            _.pairs(_.omit(weatherUpdate, 'added')).forEach(function(pair) {
                var datapoint = pair[0], v = pair[1];
                if(!reading[datapoint]) reading[datapoint] = {high: 0.0, low: v, mean: 0.0, total: 0.0,
                    instant_count: instants.length, updated_on: weatherUpdate.added.toUTCString(), reading_name: datapoint};
                if(v > reading[datapoint].high) reading[datapoint].high = v;
                if(v < reading[datapoint].low) reading[datapoint].low = v;
                reading[datapoint].total +=v;
            });
        });
    });

    // set the mean on all the readings and then insert
    _.values(reading).forEach(function(r) {
        r.total = Math.roundFour(r.total);
        r.mean = Math.roundFour(r.total / r.instant_count);
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
