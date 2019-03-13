"use strict";
let router = require('express').Router();
const dbUtils = require('../../neo4j/dbUtils'); //TODO: separate the dbUtils layer
const logger = require("../../util/logger"); //TODO: make this path more absolute

router.get('/:match_id/teams', async function (req, res, next) {
	const matchNum = parseInt(req.params.match_id, 10);
	if (Number.isNaN(matchNum)) {
		logger.debug(`bad match number`);
		res.json({ success: false });
	} else {
		const curEvent = await dbUtils.queryDB('getCurEvent', {});
		const teams = await dbUtils.queryDB('getQualTeams', { eventId: curEvent, matchNum: matchNum });
		if (teams.success === false) {
			logger.debug(`could not find teams`);
			res.json({ success: false });
		} else {
			logger.debug(`got teams ${teams} for match ${matchNum} of ${curEvent}`);
			res.json(teams);
		}
	}
});

module.exports = router;
