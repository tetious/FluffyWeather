var sp = require("serialport"),
    db = require('./database.json'),
    DataAccess = require('./dal');

var Xbee = function(dal) {
    this.dal = dal;
    var port = new sp.SerialPort("/dev/ttyAMA0", {
        parser: sp.parsers.readline("\n")
    });

    port.on('open', function() {
        console.log("Serial port open.");

        port.on('data', function(data) {
            dal.insertWeatherUpdate(data);
        });
    })
};

var dal = new DataAccess(db[process.env.NODE_ENV || 'dev']);
var xbee = new Xbee(dal);