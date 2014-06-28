Array.prototype.last = function() {
    return this[this.length - 1];
};

Math.roundFour = function(val) {
    return Math.round(val * 10000) / 10000;
};

var dateTimeReviver = function (key, value) {
    var reISO = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*))(?:Z|(\+|-)([\d|:]*))?$/;
    var a;
    if (typeof value === 'string') {
        a = reISO.exec(value);
        if (a) {
            return new Date(value);
        }
    }
    return value;
}

var oldParse = JSON.parse;
JSON.parse = function(toParse) {
    return oldParse(toParse, dateTimeReviver);
}