/// <reference path="typings/express/express.d.ts" />

var express = require('express'),
    errorHandler = require('errorhandler'),
    path = require('path'),
    http = require('http'),
    XBee = require('svd-xbee');

var app = express();

app.set('port', process.env.PORT || 3000);
app.use(express.static(path.join(__dirname, 'public')));

var router = express.Router();

router.route('/api/weather')
    .get((req, res, next) => {
        res.send('GET');
    });

var env = process.env.NODE_ENV || 'dev';

app.use(router);

if (env === 'dev') {
    app.use(errorHandler());
}

http.createServer(app).listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});