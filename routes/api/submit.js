"use strict";
let router = require('express').Router();
const logger = require("../../util/logger");
const matchQuerier = require('../../util/match-querier');
const calcQuerier = require('../../util/analytics-calc');

router.post('/', async function (req, res, next) {
	try {
		logger.debug(`Incoming form ${JSON.stringify(req.body)}`);
		await matchQuerier.submitMatch(req.body);
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
