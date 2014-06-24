Array.prototype.last = function() {
    return this[this.length - 1];
};

Math.roundFour = function(val) {
    return Math.round(val * 10000) / 10000;
};