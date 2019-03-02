"use strict";
let dbUtils = require('../neo4j/dbUtils');
let logger = require('./logger');
let appConfig = require('../config/appConfig.json');

exports.getCurMatch = async function() {
	let num = await dbUtils.queryDB('getCurMatch', {event: appConfig.curEvent});
	return num;
}
