"use strict";
let router = require('express').Router();
const matchQuerier = require('../../util/match-querier');
const logger = require("../../util/logger");

router.get('/:match_id/teams', async function (req, res, next) {
	const matchNum = parseInt(req.params.match_id, 10);
	if (Number.isNaN(matchNum)) {
		logger.debug(`bad match number`);
		res.json({ success: false });
	} else {
		const teams = await matchQuerier.getTeamsForMatch(matchNum);
		if (teams.success === false) {
			logger.debug(`could not find teams`);
			res.json({ success: false });
		} else {
			logger.debug(`got teams ${teams} for match ${matchNum}`);
			res.json(teams);
		}
	}
});

module.exports = router;
