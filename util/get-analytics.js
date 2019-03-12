"use strict";
const dbUtils = require('../neo4j/dbUtils');

exports.getTeamAgg = async (teamId) => {
	const curEvent = await dbUtils.queryDB('getCurEvent',{});
	let res = await dbUtils.queryDB('getTeamAggStats',{teamNum:teamId,eventId:curEvent});
	return res;
}

exports.getTeamMbm = async (teamId) => {
	const curEvent = await dbUtils.queryDB('getCurEvent',{});
	let res = await dbUtils.queryDB('getFormMetricsForTeam',{teamNum:teamId,eventId:curEvent});
	return res;
}
