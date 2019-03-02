"use strict";
let router = require('express').Router();
const logger = require("../util/logger");
let statsRouter = require('./api/stats');
let matchesRouter = require('./api/matches');
let submitRouter = require('./api/submit');
let eventRouter = require('./api/event');

//Nested routes
router.use('/v1/stats', statsRouter);
router.use('/v1/matches', matchesRouter);
router.use('/v1/submitForm', submitRouter);
router.use('/v1/event', eventRouter);

module.exports = router;
