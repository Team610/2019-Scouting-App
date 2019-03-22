"use strict";
const dbUtils = require('../neo4j/dbUtils');
const logger = require('./logger');
const eventQuerier = require('./event-querier');

exports.getUser = async (argUser) => {
	let email = argUser.email;
	let name = argUser.name;
	try {
		let dbUser = await dbUtils.queryDB('getUser', {
			userName: name,
			userEmail: email
		});
		if(dbUser.status === 'failed') {
			dbUser = await dbUtils.queryDB('createUser', {
				userName: name,
				userEmail: email,
				userRole: 0
			});
			logger.debug(`Created user ${dbUser.name}`);
		}
		logger.debug(`Returning user ${dbUser.name}`);
		return dbUser;
	} catch (err) {
		logger.debug(`Unable to find user ${name}`);
		logger.debug(err.stack);
	}
}

exports.generateUsers = async () => {
	try {
		const curEvent = await eventQuerier.getCurEvent();
		await dbUtils.queryDB('createUserNodes', {});
		await dbUtils.queryDB('createUserScoutRelationships', {eventId: curEvent});
		return 0;
	} catch (err) {
		logger.debug(`${err.stack}`);
		return -1;
	}
}
