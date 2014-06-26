var express = require('express'),
    errorHandler = require('errorhandler'),
    path = require('path'),
    http = require('http'),
    db = require('./database.json'),
    DataAccess = require('./dal');

var app = express();

app.set('port', 3000);
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



http.createServer(app).listen(app.get('port'), function() {
   console.log('Listening on http://localhost:3000');
});
