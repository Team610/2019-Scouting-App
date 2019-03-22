"use strict";
let router = require('express').Router();
const logger = require('../../util/logger');
const curMatchTeamQuerier = require('../../util/cur-match-team');
const calcQuerier = require('../../util/analytics-calc');
const matchQuerier = require('../../util/match-querier');
const eventQuerier = require('../../util/event-querier');
const fields = require('../../config/formConfig.json').form_db_interface;

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

router.get('/calcAnalytics', async function (req, res, next) {
	try {
		const resNum = await calcQuerier.calculateForAll();
		res.json({ success: resNum === 0 });
	} catch (err) {
		logger.debug(err.message);
		logger.debug("could not calculate analytics");
		res.json({ success: false });
	}
});

router.get('/calcAnalytics/:team_id', async function (req, res, next) {
	let team = req.params.team_id;
	try {
		const resNum = await calcQuerier.calculateForTeam(team);
		res.json({ success: resNum > 0 });
	} catch (err) {
		logger.debug(err.stack);
		logger.debug("could not calculate analytics");
		res.json({ success: false });
	}
});

router.post('/createEvent', async function (req, res, next) {
	let newEvent = req.body.eventCode;
	logger.debug(`creating event ${newEvent}`);
	await eventQuerier.createEvent(newEvent);
	await calcQuerier.calculateForAll();

	let curEvent = await eventQuerier.setCurEvent(newEvent);
	if (curEvent === -1) {
		logger.debug(`failed to update current event to ${newEvent}`);
		res.json({ success: false });
	} else {
		logger.debug(`successfully updated current event to ${curEvent}`);
		res.json({ success: true, event: curEvent });
	}
});
//TODO: create a "getEventList" query

router.post('/createForm', async function (req, res, next) {
	let data = {
		teamNum: req.body.teamNum,
		matchNum: req.body.matchNum,
		user: req.body.user
	};
	logger.debug(`Creating new form for team ${data.teamNum} in match ${data.matchNum}`);
	for (let field of fields) {
		data[field.form_field_id] = field.type === 'enum' ? 'blank' : [];
	}
	let result = await matchQuerier.submitMatch(data);

	res.json({ success: result });
});

module.exports = router;
