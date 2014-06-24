require('./utils');
var pg = require('pg'),
    sql = require('sql-bricks'),
    _ = require('underscore');

var DataAccess = function (config) {
    this.client = new pg.Client(config);
    this.client.connect();
    this.weatherUpdates = [];
};

DataAccess.prototype.insertWeatherUpdate = function(rawWeatherUpdate) {
    var update = {};
    rawWeatherUpdate.replace(/(\[|\])/g, '').split('&').forEach(function (item) {
        var splitItem = item.split('=');
        update[splitItem[0]] = splitItem[1];
    });

    var now = new Date();
    var last = this.weatherUpdates.last();
    if(last && now.getMinutes() != last.added.getMinutes()) {
        this.insertReading();
    }

    this.weatherUpdates.push({
        rainfall: parseFloat(update['ri']),
        wind_speed: parseFloat(update['ws']),
        wind_direction: parseFloat(update['wd']),
        temperature: parseFloat(update['t']),
        pressure: parseFloat(update['p']),
        humidity: parseFloat(update['h']),
        added: new Date()
    });
};

DataAccess.prototype.insertReading = function() {
    var reading = {};
    var now = new Date();

    // we need to turn the list of updates into a list of readings, one per data point
    this.weatherUpdates.forEach(function(update) {
        _.pairs(_.omit(update, 'added')).forEach(function(pair) {
            var datapoint = pair[0], v = pair[1];
            if(!reading[datapoint]) reading[datapoint] = {high: 0.0, low: 0.0, mean: 0.0, total: 0.0,
                instant_count: this.weatherUpdates.length, updated_on: now.toUTCString(), reading_name: datapoint};
            if(v > reading[datapoint].high) reading[datapoint].high = v;
            if(v < reading[datapoint].low) reading[datapoint].low = v;
            reading[datapoint].total +=v;
        }, this);
    }, this);

    // set the mean on all the readings and then insert
    _.values(reading).forEach(function(r) {
        r.total = r.total.toFixed(4);
        r.mean = (r.total / r.instant_count).toFixed(4);
        this.runQuery(sql.insert('reading', r));
    }, this);

    this.weatherUpdates = [];
};

DataAccess.prototype.runQuery = function(sql, resultCallback)  {
    console.log(sql.toString());

    var query = this.client.query(sql.toString(), resultCallback);

    query.on('error', function(err) {
        console.error('PGSQL: Error running query.', err);
    });

    query.on('end', function() {
       console.log("end");
    });
};

module.exports = DataAccess;
