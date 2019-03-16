"use strict";
const dbUtils = require('../neo4j/dbUtils');
const logger = require('./logger');
const analyticsConfig = require('../config/formConfig.json').db_analytics_agg;
const request = require('request-promise');

exports.createEvent = async (eventCode) => {
	logger.debug(`creating event ${eventCode}`);
	await dbUtils.queryDB('createEvent', { eventId: eventCode });
	let rawMatchList = await request({
		uri: `https://www.thebluealliance.com/api/v3/event/${eventCode}/matches/simple`,
		headers: {
			"X-TBA-Auth-Key": "WWbuyDx53ooxSxKsKG5rKb1j4vdzjNHbs7fjE8y3Utl3X7IogxeVkBile53EvdNx"
		},
		json: true
	});
	let matchesParams = { matchList: [] };
	let count = 0;
	for (let i = 0; i < rawMatchList.length; i++) {
		if (rawMatchList[i].comp_level != 'qm') {
			continue;
		}
		let matchNum = rawMatchList[i].match_number;
		let blue = rawMatchList[i].alliances.blue.team_keys;
		let red = rawMatchList[i].alliances.red.team_keys;
		for (let j = 0; j < 3; j++) {
			blue[j] = blue[j].substring(3);
			red[j] = red[j].substring(3);
		}
		matchesParams.matchList[count] = {
			num: matchNum,
			teams: [red[0], red[1], red[2], blue[0], blue[1], blue[2]]
		}
		count++;
	}
	matchesParams.eventId = eventCode;
	let matchRes = await dbUtils.queryDB('createEventMatches', matchesParams);
	logger.debug(`created matches for ${matchRes.id}`);

	let rawTeamList = await request({
		uri: `https://www.thebluealliance.com/api/v3/event/${eventCode}/teams/simple`,
		headers: {
			"X-TBA-Auth-Key": "WWbuyDx53ooxSxKsKG5rKb1j4vdzjNHbs7fjE8y3Utl3X7IogxeVkBile53EvdNx"
		},
		json: true
	});
	let teamsParams = { teamList: [] };
	for (let i = 0; i < rawTeamList.length; i++) {
		teamsParams.teamList[i] = rawTeamList[i].team_number;
	}
	teamsParams.eventId = eventCode;
	let teamRes = await dbUtils.queryDB('createEventTeams', teamsParams);
	logger.debug(`created teams for ${teamRes.id}`);

	let analyticsParams = teamsParams;
	analyticsParams.statList = [];
	for (let config of analyticsConfig) {
		analyticsParams.statList.push(config.name);
	}
	let analyticsRes = await dbUtils.queryDB('createEventTeamAnalytics', analyticsParams);
	logger.debug(`created team analytic nodes for ${analyticsRes.id}`);
}

exports.getTeams = async function (event) {
	if (event === undefined)
		event = await getCurEvent();
	let teams = await dbUtils.queryDB('getTeamList', { eventId: event });
	return teams;
}

const getCurEvent = exports.getCurEvent = async () => {
	let e = await dbUtils.queryDB('getCurEvent', {});
	return e;
}

exports.setCurEvent = async (event) => {
	let e = await dbUtils.queryDB('setCurEvent', { eventId: event });
	return e;
}
