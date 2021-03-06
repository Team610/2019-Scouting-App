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

app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

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

// app.use('/admin', require('./routes/index'));
app.use('/api', require('./routes/api'));
app.use('/auth', require('./routes/auth'));
// app.use('*', function (req, res) {
// 	res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
// });

if (process.env.NODE_ENV === 'production') {
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
		res.sendFile(path.join(__dirname + '/client/public/index.html'));
	})
}

// catch 404 and forward to error handler
app.use(function (req, res, next) { //TODO: give a 404 error msg
	res.status(404).redirect('/');
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

// neoDriver.close();

module.exports = app;
