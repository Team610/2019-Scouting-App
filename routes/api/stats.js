"use strict";
const request = require('request');
let router = require('express').Router();
const dbUtils = require('../../neo4j/dbUtils');
const logger = require("../../util/logger"); //TODO: make this path more absolute
const querier = require("../../util/get-analytics");
const appConfig = require("../../config/appConfig.json");

async function teamMiddleware(req) {
    if(!req.query.teams) {
        req.query.teams = await dbUtils.queryDB('getTeamList',{eventId:appConfig.curEvent});
    }
    return req;
}

router.get('/team/:team_id/agg', async function (req, res, next) {
	let teamid = req.params.team_id;
	let dbStats = await querier.getTeamAgg(teamid);
    let finaljson = {};
	finaljson[teamid] = dbStats;
    res.json(finaljson);
});

router.get('/team/:team_id/mbm', async function (req, res, next) {
	let teamid = req.params.team_id;
	let dbStats = await querier.getTeamMbm(teamid);
	let finaljson = {};
	finaljson[teamid] = dbStats;
    res.json(finaljson);
});

router.get('/teams/agg', async function (req, res, next) {
    let finaljson = {};
    req = await teamMiddleware(req);
    for (let team of req.query.teams) {
		let dbStats = await querier.getTeamAgg(team);
        finaljson[team]=dbStats;
    }
    res.json(finaljson);
});

router.get('/teams/mbm', async function (req, res, next) {
    let finaljson = {};
    req = await teamMiddleware(req);
    for (let team of req.query.teams) {
		let dbStats = await querier.getTeamMbm(team);
        finaljson[team]=dbStats;
    }
    res.json(finaljson);
});

module.exports = router;
