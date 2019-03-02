"use strict";
const request = require('request');
let router = require('express').Router();
const logger = require('../../util/logger');
let curMatchTeamQuerier = require('../../util/cur-match-team');
let eventTeamQuerier = require('../../util/event-teams');
let appConfig = require('../../config/appConfig.json');

router.get('/getEventTeams', async function (req, res, next) {
	let teams = await eventTeamQuerier.getTeams(appConfig.curEvent);
	logger.debug(`team list: ${teams}`);
	res.json(teams);
});

router.post('/getNextUserMatch', async function(req, res, next) {
	let nums = await curMatchTeamQuerier.getCurMatchTeam(req.body);
	logger.debug(`cur match num: ${JSON.stringify(nums)}`);
	res.json(nums);
});

module.exports = router;
