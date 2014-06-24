var sp = require("serialport");

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

module.exports = Xbee;