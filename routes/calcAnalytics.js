"use strict";
const matchFormConfig = require('../config/matchFormConfig.json');
const request = require('request');
let router = require('express').Router();
const dbUtils = require('../neo4j/dbUtils');
const logger = require("../util/logger");

router.get('/', async function(req, res, next) {
	//TODO: finish the calculate analytics function

    res.redirect('/');
});

module.exports = router;
