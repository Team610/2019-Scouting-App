"use strict";
const dbUtils = require('../neo4j/dbUtils');
const logger = require('./logger');
const fs = require('fs');

exports.addPhoto = async (teamNum, view, photo) => {
	await dbUtils.queryDB('addRobotPhoto', {
		teamNum: teamNum,
		view: view,
		photoURL: photo,
		time: new Date().getTime()
	});
}

exports.getPhotos = async (teamNum, view) => {
	const res = await dbUtils.queryDB('getRobotPhotos', {
		teamNum: teamNum,
		view: view
	});
	let arr = [];
	for (let photo of res) {
		arr.push(fs.readFileSync(photo, { encoding: 'utf-8' }));
	}
	return arr;
}
