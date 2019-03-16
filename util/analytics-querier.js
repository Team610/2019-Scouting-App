"use strict";
const dbUtils = require('../neo4j/dbUtils');
const eventQuerier = require('./event-querier');

exports.getTeamAgg = async (teamId) => {
	const curEvent = await eventQuerier.getCurEvent();
	let res = await dbUtils.queryDB('getTeamAggStats',{teamNum:teamId,eventId:curEvent});
	return res;
}

exports.getTeamMbm = async (teamId) => {
	const curEvent = await eventQuerier.getCurEvent();
	let res = await dbUtils.queryDB('getFormMetricsForTeam',{teamNum:teamId,eventId:curEvent});
	return res;
}
