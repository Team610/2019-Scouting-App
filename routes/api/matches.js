"use strict";
const request = require('request');
let router = require('express').Router();
const dbUtils = require('../../neo4j/dbUtils');
const logger = require("../../util/logger"); //TODO: make this path more absolute
const appConfig = require("../../config/appConfig");

router.get('/:match_id/teams', async function (req, res, next) {
    logger.debug(`getting teams for match ${req.params.match_id} in event ${appConfig.curEvent}`);
    let teams = await dbUtils.queryDB('getQualTeams', {eventId: appConfig.curEvent, matchNum: parseInt(req.params.match_id)});
    res.json(teams);
});

module.exports = router;
