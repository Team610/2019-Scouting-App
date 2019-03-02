"use strict";
let dbUtils = require('../neo4j/dbUtils');
let logger = require('./logger');

exports.getTeams = async function(event) {
	let teams = await dbUtils.queryDB('getTeamList',{eventId: event});
	return teams;
}
