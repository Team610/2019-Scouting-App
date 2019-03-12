"use strict";
let router = require('express').Router();
const dbUtils = require('../../neo4j/dbUtils');
const logger = require("../../util/logger"); //TODO: make this path more absolute
const querier = require("../../util/get-analytics");

async function teamMiddleware(req) {
    if(!req.query.teams) {
		const curEvent = await dbUtils.queryDB('getCurEvent',{});
        req.query.teams = await dbUtils.queryDB('getTeamList',{eventId:curEvent});
    }
    return req;
}

router.get('/team/:team_id/agg', async function (req, res, next) {
	let teamid = req.params.team_id;
	let dbStats = await querier.getTeamAgg(teamid);
    let finaljson = {};
	finaljson[teamid] = dbStats;
	logger.debug(`got aggregate stats for team ${teamid}`);
    res.json(finaljson);
});

router.get('/team/:team_id/mbm', async function (req, res, next) {
	let teamid = req.params.team_id;
	let dbStats = await querier.getTeamMbm(teamid);
	let finaljson = {};
	finaljson[teamid] = dbStats;
	logger.debug(`got match-by-match stats for team ${teamid}`);
    res.json(finaljson);
});

router.get('/teams/agg', async function (req, res, next) {
    let finaljson = {};
    req = await teamMiddleware(req);
    for (let team of req.query.teams) {
		let dbStats = await querier.getTeamAgg(team);
        finaljson[team]=dbStats;
	}
	logger.debug(`got aggregate stats for all teams`);
    res.json(finaljson);
});

router.get('/teams/mbm', async function (req, res, next) {
    let finaljson = {};
    req = await teamMiddleware(req);
    for (let team of req.query.teams) {
		let dbStats = await querier.getTeamMbm(team);
        finaljson[team]=dbStats;
	}
	logger.debug(`got match-by-match stats for all teams`);
    res.json(finaljson);
});

module.exports = router;
