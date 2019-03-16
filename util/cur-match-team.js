"use strict";
const dbUtils = require('../neo4j/dbUtils');
const logger = require('./logger');
const eventQuerier = require('./event-querier');

exports.getCurMatchTeam = async function(user) {
	const curEvent = await eventQuerier.getCurEvent();
	logger.debug(`submitting for user ${user.email} in event ${curEvent}`);
	let quals = await dbUtils.queryDB('getQualsForUser', {userEmail: user.email, eventId: curEvent});
	let minMatchNum = 1000;
	let ind = -1;
	logger.debug(`quals: ${JSON.stringify(quals)}`);
	for(let i in Object.keys(quals)) {
		if(!quals[i].rel.submitted) {
			if(quals[i].qual.matchNum < minMatchNum) {
				minMatchNum = quals[i].qual.matchNum;
				ind = i;
			}
		}
	}

	let teams = await dbUtils.queryDB('getQualTeams', {eventId: curEvent, matchNum: minMatchNum});
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
		teamNum: teamNum,
		alliance: alliance
	}
	logger.debug(`obtained ${JSON.stringify(nums)}`);
	return nums;
}
