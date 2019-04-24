"use strict";
let router = require('express').Router();
const matchQuerier = require('../../util/match-querier');
const logger = require("../../util/logger");

router.get('/:match_id/teams', async function (req, res, next) {
	const matchNum = processMatchNum(req.params.match_id);
	if (matchNum === false) {
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

function processMatchNum(val) {
	if (Number.isNaN(parseInt(val, 10))) {
		if ((val.charAt(0) === 'Q' || val.charAt(0) === 'S' || val.charAt(0) === 'F') && (val.charAt(2) === '-'))
			return val;
	} else {
		if (Number(val) > 0 && Number(val) < 200)
			return Number(val);
	}
	return false;
}

module.exports = router;
