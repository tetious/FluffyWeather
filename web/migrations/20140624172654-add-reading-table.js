var dbm = require('db-migrate');
var type = dbm.dataType;

exports.up = function(db, callback) {
    db.createTable('reading', {
        id: { type: 'int', primaryKey: true, autoIncrement: true},
        reading_name: 'string',
        high: 'decimal',
        low: 'decimal',
        mean: 'decimal',
        total: 'decimal',
        instant_count: 'int',
        updated_on: 'datetime'
    }, callback);
};

exports.down = function(db, callback) {
    db.dropTable('reading', callback);
};
