"use strict";
let dbUtils = require('../neo4j/dbUtils');
let logger = require('./logger');
const appConfig = require('../config/appConfig.json');

exports.createEvent = async (eventCode) => {
    logger.debug(`creating event ${eventCode}`);
    let matchList = await fetch(`www.thebluealliance.com/api/v3/event/${appConfig.curEvent}/matches/simple`, {
        //TODO: finish this fetch request
    });
    let matchRes = await dbUtils.queryDB('createEventMatches',{});

    let teamList = await fetch(`/event/${appConfig.curEvent}/teams/simple`, {
        //TODO: finish this fetch request
    });
    let teamRes = await dbUtils.queryDB('createEventTeams', {});
}
