"use strict";
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var morgan = require('morgan');
var bodyParser = require('body-parser');
var passport = require('passport');
var session = require('express-session');
require('dotenv').config();

var app = express();

// Define logger
morgan.token('id', function getId(req) {
    return req.id
});
var loggerFormat = ':id [:date[web]] ":method :url" :status :response-time  ms - :res[content-length] bytes';
app.use(morgan(loggerFormat, {
    skip: function (req, res) {
        return res.statusCode < 400
    },
    stream: process.stderr
}));
app.use(morgan(loggerFormat, {
    skip: function (req, res) {
        return res.statusCode >= 400
    },
    stream: process.stdout
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//Auth initialization
// app.use(session({
//     secret: 's3cr3t',
//     resave: true,
//     saveUninitialized: true
// }));
// app.use(passport.initialize());
// app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/public', express.static('public'));

app.use('/admin', require('./routes/index'));
app.use('/calcAnalytics', require('./routes/calcAnalytics'));
app.use('/api', require('./routes/api'));
app.use('/createEvent', require('./routes/createEvent'));
app.use('/auth', require('./routes/auth'));
app.use('/userGen', require('./routes/userGen'));
app.use('/createForm', require('./routes/createForm'));

if(process.env.NODE_ENV === 'production') {
    //production mode
    console.log('Production mode starting ...');
    app.use(express.static(path.join(__dirname, 'client/build')));
    app.get('/', (req, res) => {
        res.sendfile(path.join(__dirname = 'client/build/index.html'));
    })
} else {
    //build mode
    console.log('Build mode starting ...');
    // app.use(express.static(path.join(__dirname, 'public')));
    // app.use('/public', express.static('public'));
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname+'/client/public/index.html'));
    })
}

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

// neoDriver.close();

module.exports = app;
