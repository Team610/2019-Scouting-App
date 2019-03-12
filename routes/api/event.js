"use strict";
let router = require('express').Router();
const logger = require('../../util/logger');
const curMatchTeamQuerier = require('../../util/cur-match-team');
const eventQuerier = require('../../util/event-querier');

router.get('/getEventTeams', async function (req, res, next) {
	let curEvent = await eventQuerier.getCurEvent();
	let teams = await eventQuerier.getTeams(curEvent);
	logger.debug(`team list: ${teams}`);
	res.json(teams);
});

router.post('/getNextUserMatch', async function(req, res, next) {
	let nums = await curMatchTeamQuerier.getCurMatchTeam(req.body);
	logger.debug(`cur match num: ${JSON.stringify(nums)}`);
	res.json(nums);
});

module.exports = router;
