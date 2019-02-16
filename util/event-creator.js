"use strict";
let dbUtils = require('../neo4j/dbUtils');
const logger = require('./logger');
const appConfig = require('../config/appConfig.json');
const request = require('request-promise');

exports.createEvent = async (eventCode) => {
	logger.debug(`creating event ${eventCode}`);
    let matchList = await request({
		uri: `https://www.thebluealliance.com/api/v3/event/${eventCode}/matches/simple`,
        headers: {
			"X-TBA-Auth-Key": "WWbuyDx53ooxSxKsKG5rKb1j4vdzjNHbs7fjE8y3Utl3X7IogxeVkBile53EvdNx"
		},
		json: true
	});
	for (let i=0; i<matchList.length; i++) {
		if(matchList[i].comp_level != 'qm') {
			continue;
		}
		let matchNum = matchList[i].match_number;
		let blue = matchList[i].alliances.blue.team_keys;
		let red = matchList[i].alliances.red.team_keys;
		for (let j=0; j<3; j++) {
			blue[j] = blue[j].substring(3);
			red[j] = red[j].substring(3);
		}
		matchList[i] = {
			num: matchNum,
			teams: [red[0], red[1], red[2], blue[0], blue[1], blue[2]]
		}
	}
	matchList['event'] = eventCode;
    // let matchRes = await dbUtils.queryDB('createEventMatches', matchList);

    let teamList = await request({
		uri: `https://www.thebluealliance.com/api/v3/event/${eventCode}/teams/simple`,
        headers: {
			"X-TBA-Auth-Key": "WWbuyDx53ooxSxKsKG5rKb1j4vdzjNHbs7fjE8y3Utl3X7IogxeVkBile53EvdNx"
		},
		json: true
	});
	for (let i=0; i<teamList.length; i++) {
		teamList[i] = teamList[i].team_number;
	}
	teamList['event'] = eventCode;
	// let teamRes = await dbUtils.queryDB('createEventTeams', teamList);
	console.log(matchList);
	console.log(teamList);
}
