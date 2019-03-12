"use strict";
const dbUtils = require('../neo4j/dbUtils');
const logger = require('./logger');

exports.generateUsers = async () => {
	try {
		const curEvent = dbUtils.queryDB('getCurEvent', {});
		await dbUtils.queryDB('createUserNodes', {});
		await dbUtils.queryDB('createUserScoutRelationships', {eventId: curEvent});
		return true;
	} catch (err) {
		logger.debug(`${err.stack}`);
		return false;
	}
}
