var express = require('express'),
    errorHandler = require('errorhandler'),
    path = require('path'),
    http = require('http'),
    Xbee = require('./xbee');

var db = require('./database.json')

var DataAccess = require('./dal');

var app = express();

app.set('port', 3000);
app.use(express.static(path.join(__dirname, 'public')));
app.set('env', process.env.NODE_ENV || 'dev');

if(app.get('env') === 'dev') {
    app.use(errorHandler());
}

var router = express.Router();

router.route('/api/weather')
    .get(function (req, res, next) {
        res.send('GET');
    });

app.use(router);

var dal = new DataAccess(db[app.get('env')]);
var xbee = new Xbee(dal);

//http.createServer(app).listen(app.get('port'), function() {
//   console.log('Listening on http://localhost:3000');
//});
