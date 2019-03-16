"use strict";
let router = require('express').Router();
const logger = require("../../util/logger");
const analyticsQuerier = require("../../util/analytics-querier");
const eventQuerier = require('../../util/event-querier');

async function teamMiddleware(req) { //TODO: abstract db
	if (!req.query.teams)
		req.query.teams = await eventQuerier.getTeams();
	return req;
}

router.get('/team/:team_id/agg', async function (req, res, next) {
	let teamid = req.params.team_id;
	let dbStats = await analyticsQuerier.getTeamAgg(teamid);
	let finaljson = {};
	finaljson[teamid] = dbStats;
	logger.debug(`got aggregate stats for team ${teamid}`);
	res.json(finaljson);
});

router.get('/team/:team_id/mbm', async function (req, res, next) {
	let teamid = req.params.team_id;
	let dbStats = await analyticsQuerier.getTeamMbm(teamid);
	let finaljson = {};
	finaljson[teamid] = dbStats;
	logger.debug(`got match-by-match stats for team ${teamid}`);
	res.json(finaljson);
});

router.get('/teams/agg', async function (req, res, next) {
	let finaljson = {};
	req = await teamMiddleware(req);
	for (let team of req.query.teams) {
		let dbStats = await analyticsQuerier.getTeamAgg(team);
		finaljson[team] = dbStats;
	}
	logger.debug(`got aggregate stats for all teams`);
	res.json(finaljson);
});

router.get('/teams/mbm', async function (req, res, next) {
	let finaljson = {};
	req = await teamMiddleware(req);
	for (let team of req.query.teams) {
		let dbStats = await analyticsQuerier.getTeamMbm(team);
		finaljson[team] = dbStats;
	}
	logger.debug(`got match-by-match stats for all teams`);
	res.json(finaljson);
});

module.exports = router;
