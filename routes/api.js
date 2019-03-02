"use strict";
const request = require('request');
let router = require('express').Router();
let statsRouter = require('./api/stats');
const logger = require("../util/logger");
let matchesRouter = require('./api/matches');
let submitRouter = require('./api/submit');
let curMatchQuerier = require('../util/cur-match.js');

//Nested routes
router.use('/v1/stats', statsRouter);
router.use('/v1/matches', matchesRouter);
router.use('/v1/submitForm', submitRouter);
router.get('/v1/curMatch', async function(req, res, next) {
	let num = await curMatchQuerier.getCurMatch();
	logger.debug(`cur match num: ${num}`);
	res.json({num: num});
});

module.exports = router;
