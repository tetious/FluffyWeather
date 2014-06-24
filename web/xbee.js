var xbee = require('svd-xbee');

var Xbee = function(dal) {
    this.dal = dal;
    this.xbee = new xbee({port: '/dev/ttyAMA0'});

};

module.exports = Xbee;