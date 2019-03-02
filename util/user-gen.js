"use strict";
let dbUtils = require('../neo4j/dbUtils');
let logger = require('./logger');

exports.generateUsers = async () => {
	try {
		await dbUtils.queryDB('createUserNodes', {});
		await dbUtils.queryDB('createUserScoutRelationships', {});
		return true;
	} catch (err) {
		logger.debug(`${err.stack}`);
		return false;
	}
}
