"use strict";
let dbUtils = require('../neo4j/dbUtils');
let logger = require('./logger');
let appConfig = require('../config/appConfig.json');

exports.getCurMatchTeam = async function(user) {
	let quals = await dbUtils.queryDB('getQualsForUser', {event: appConfig.curEvent, userEmail: user.email});
	let minMatchNum = 1000;
	let ind = -1;
	for(let i=0; i<quals.length; i++) {
		if(!quals[i].rel.submitted) {
			if(quals[i].qual.matchNum < minMatchNum) {
				minMatchNum = quals[i].qual.matchNum;
				ind = i;
			}
		}
	}

	let teams = await dbUtils.queryDB('getQualTeams', {event: appConfig.curEvent, matchNum: minMatchNum});
	let teamNum = -1;
	let alliance = 'neither';
	if(quals[ind].rel.station === 'Red1') {
		teamNum = teams[0];
		alliance = 'red';
	} else if (quals[ind].rel.station === 'Red2') {
		teamNum = teams[1];
		alliance = 'red';
	} else if (quals[ind].rel.station === 'Red3') {
		teamNum = teams[2];
		alliance = 'red';
	} else if (quals[ind].rel.station === 'Blue1') {
		teamNum = teams[3];
		alliance = 'blue';
	} else if (quals[ind].rel.station === 'Blue2') {
		teamNum = teams[4];
		alliance = 'blue';
	} else if (quals[ind].rel.station === 'Blue3') {
		teamNum = teams[5];
		alliance = 'blue';
	} else {
		logger.debug('Relationship station not properly defined!');
	}

	let nums = {
		matchNum: minMatchNum,
		teamNum: teamNum
	}
	return nums;
}
