"use strict";
let dbUtils = require('../neo4j/dbUtils');
let logger = require('./logger');
let appConfig = require('../config/appConfig.json');

exports.generateUsers = async () => {
	try {
		await dbUtils.queryDB('createUserNodes', {});
		await dbUtils.queryDB('createUserScoutRelationships', {eventId: appConfig.curEvent});
		return true;
	} catch (err) {
		logger.debug(`${err.stack}`);
		return false;
	}
}
