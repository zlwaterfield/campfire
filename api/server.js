var express = require('express'),
    users = require('./routes/users'),
    app = express();

app.configure(function () {
    //app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
});

app.use("/styles", express.static('public/styles'));
app.use("/fonts", express.static('public/fonts'));

app.get('/', express.static('public'));
app.get('/get', users.getInfo);
app.get('/post', users.postInfo);

app.get('*', function(req, res, next) {
    res.status(500).send('Sorry this URL is not found please refer to the documentation at https://github.com/zlwaterfield/wilted');
});

app.listen(3000);
console.log('Listening on port 3000...');
