"use strict";
const matchFormConfig = require('../config/matchFormConfig.json');
const request = require('request');
let router = require('express').Router();
const dbUtils = require('../neo4j/dbUtils');
const logger = require("../util/logger");
const querier = require("../util/analytics-calc")

router.get('/', async function(req, res, next) {
	querier.calculateForTeam(610); //TODO: get team num dynamically
    res.redirect('/');
});

module.exports = router;
