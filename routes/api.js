"use strict";
const request = require('request');
let router = require('express').Router();
let statsRouter = require('./api/stats');
const dbUtils = require('../neo4j/dbUtils');
const logger = require("../util/logger");

//Nested routes
router.use('/v1/stats', statsRouter);

module.exports = router;
