"use strict";
const request = require('request');
let router = require('express').Router();
const dbUtils = require('../neo4j/dbUtils');
const logger = require("../util/logger");
const querier = require("../util/analytics-calc");
const appConfig = require("../config/appConfig");

router.get('/', async function(req, res, next) {
    let list = await dbUtils.queryDB('getTeamList', {eventId:appConfig.curEvent});
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
