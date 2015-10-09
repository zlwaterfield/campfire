var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var app = express();
var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', 'example.com');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(allowCrossDomain);
app.use(require('less-middleware')(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '/public')));
app.use('fonts', express.static('public/fonts'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Routes
var index = require('./routes/views/index');
var item = require('./routes/views/item');
var api = require('./routes/api_static');
var base_api = require('./routes/api_db');

// Explore Routes
app.use('/', index);
app.use('/explore/', index);
app.use('/item/:id', item);

// Api Routes
app.get('/api/tag_btns', api.getTagBtns);
app.get('/api/item/:id', base_api.getItem);
app.get('/api/:type/:cat', base_api.getConferences);

// Other redirect
app.use('*', function(req, res) {
  res.redirect('/explore/');
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
