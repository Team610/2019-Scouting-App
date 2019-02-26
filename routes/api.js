"use strict";
const request = require('request');
let router = require('express').Router();
let statsRouter = require('./api/stats');
const logger = require("../util/logger");
let matchesRouter = require('./api/matches');
let submitRouter = require('./api/submit');

//Nested routes
router.use('/v1/stats', statsRouter);
router.use('/v1/matches', matchesRouter);
router.use('/v1/submitForm', submitRouter);

module.exports = router;
