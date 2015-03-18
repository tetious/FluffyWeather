var express = require('express'),
    errorHandler = require('errorhandler'),
    path = require('path'),
    http = require('http'),
    db = require('./database.json'),
    DataAccess = require('./dal'),
    bodyParser = require('body-parser');

var app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.set('env', process.env.NODE_ENV || 'dev');

if(app.get('env') === 'dev') {
    app.use(errorHandler());
}

var router = express.Router();
var dal = new DataAccess(db[app.get('env')]);

router.route('/api/weather')
    .get(function (req, res, next) {
        dal.getLatestUpdate(function(update) {
            res.send(update);
        });
    });

app.use(router);

var backend = express();
backend.use(bodyParser.text());

var backendRouter = express.Router();

backendRouter.route('/api/sensor')
    .post(function (req, res, next) {
        dal.insertWeatherUpdate(req.body);
        res.send(200);
    });

backend.use(backendRouter);

http.createServer(app).listen(3000, function() {
   console.log('Frontend listening on 3000.');
});
http.createServer(backend).listen(3001, function() {
    console.log('Backend listening on 3001.')
});

