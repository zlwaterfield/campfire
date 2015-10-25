var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(allowCrossDomain);

var api_static = require('./routes/api_static.js');
var api_db = require('./routes/api_db.js');
// Api Routes
app.get('/api/tag_btns', api_static.getTagBtns);
app.get('/api/item/:id', api_db.getConferenceByID);
app.get('/api/:type/:cat', api_db.getConferences);

module.exports = app;
