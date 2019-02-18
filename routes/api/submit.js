"use strict";
const request = require('request');
let router = require('express').Router();
const dbUtils = require('../../neo4j/dbUtils');
const logger = require("../../util/logger"); //TODO: make this path more absolute
const querier = require('../../util/submit-match');

router.post('/', async function (req, res, next) {
	try {
		logger.debug(`Incoming form ${JSON.stringify(req.body)}`);
		await querier.submitMatch(req.body);
		res.json({
			success: true
		});
	} catch (err) {
		logger.debug(`Unable to submit form`);
		logger.debug(err.message);
		res.json({
			success: false
		})
	}
});

module.exports = router;