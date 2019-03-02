"use strict";
let router = require('express').Router();
const logger = require("../../util/logger"); //TODO: make this path more absolute
const submitQuerier = require('../../util/submit-match');
const calcQuerier = require('../../util/analytics-calc');

router.post('/', async function (req, res, next) {
	try {
		logger.debug(`Incoming form ${JSON.stringify(req.body)}`);
		await submitQuerier.submitMatch(req.body);
		await calcQuerier.calculateForTeam(req.body.teamNum);
		res.json({
			success: true
		});
	} catch (err) {
		logger.debug(`Unable to submit form`);
		logger.debug(err.stack);
		res.json({
			success: false
		})
	}
});

module.exports = router;