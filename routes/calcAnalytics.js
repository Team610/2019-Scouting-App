"use strict";
let router = require('express').Router();
const dbUtils = require('../neo4j/dbUtils'); //TODO: separate dbUtils layer
const logger = require("../util/logger");
const querier = require("../util/analytics-calc");

router.get('/', async function(req, res, next) {
	const curEvent = await dbUtils.queryDB('getCurEvent', {});
    let list = await dbUtils.queryDB('getTeamList', {eventId:curEvent});
    try {
        for (let team of Object.values(list)) {
            await querier.calculateForTeam(team);
        }
    } catch (err) {
        logger.debug(err.message);
        logger.debug("could not calculate analytics");
    }
    res.redirect('/admin');
});

router.get('/:team_id', async function (req, res, next) {
    let team = req.params.team_id;
    try {
        await querier.calculateForTeam(team);
    } catch (err) {
        logger.debug(err.message);
        logger.debug("could not calculate analytics");
    }
    res.redirect('/admin');
});

module.exports = router;
