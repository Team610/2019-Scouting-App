"use strict";
let dbUtils = require('../neo4j/dbUtils');
const logger = require('./logger');
const appConfig = require('../config/appConfig.json');
const configs = require('../config/formConfig.json');

exports.getTeamAgg = async (teamId) => {
	let res = await dbUtils.queryDB('getTeamAggStats',{teamNum:teamId,eventId:appConfig.curEvent});
	return res;
}

exports.getTeamMbm = async (teamId) => {
	let res = await dbUtils.queryDB('getFormMetricsForTeam',{teamNum:teamId,eventId:appConfig.curEvent});
	return res;
}
