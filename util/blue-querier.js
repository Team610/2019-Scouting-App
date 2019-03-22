"use strict";
const dbUtils = require('../neo4j/dbUtils');
const eventQuerier = require('./event-querier');

exports.getBlueSide = async (event) => {
	if (event === undefined)
		event = await eventQuerier.getCurEvent();
	const blueSide = await dbUtils.queryDB('getBlueSide', { eventId: event });
	return blueSide;
};

exports.setBlueSide = async (side, event) => {
	if (event === undefined)
		event = await eventQuerier.getCurEvent();
	const blueSide = await dbUtils.queryDB('setBlueSide', { eventId: event, side: side });
	return blueSide;
}
