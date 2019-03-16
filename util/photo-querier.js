"use strict";
const dbUtils = require('../neo4j/dbUtils');
const logger = require('./logger');

exports.addPhoto = async (teamNum, view, photo) => {
	await dbUtils.queryDB('addRobotPhoto', {
		teamNum: teamNum,
		view: view,
		photoData: photo,
		time: new Date().getTime()
	});
}

exports.getPhotos = async (teamNum, view) => {
	const res = await dbUtils.queryDB('getRobotPhotos', {
		teamNum: teamNum,
		view: view
	});
	return res;
}
