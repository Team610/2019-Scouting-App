"use strict";
let router = require('express').Router();
const logger = require("../../util/logger"); //TODO: make this path more absolute
const fs = require('fs');
require('dotenv').config();
const dbUtils = require('../../neo4j/dbUtils');
const photosDir = process.env.PHOTOS_PATH;

router.post('/', async function (req, res, next) {
	try { //TODO: secure this API
		const teamNum = req.body.teamNum;
		const view = req.body.view;
		const data = req.body.photo;
		let fileName = process.platform === 'win32' ?
			`${photosDir}\\photos\\${teamNum}\\${teamNum}_${view}.base64.jpg` :
			`${photosDir}/photos/${teamNum}/${teamNum}_${view}.base64.jpg`;
		if (fs.existsSync(fileName)) {
			let fileFound = true;
			let count = 0;
			while (fileFound) {
				fileName = process.platform === 'win32' ?
					`${photosDir}\\photos\\${teamNum}\\${teamNum}_${view}_${count}.base64.jpg` :
					`${photosDir}/photos/${teamNum}/${teamNum}_${view}_${count}.base64.jpg`;
				if (fs.existsSync(fileName)) {
					count++;
					continue;
				} else {
					fileFound = false;
				}
			}
		}
		console.log(fileName);
		fs.writeFileSync(fileName, data);
		let result = await dbUtils.queryDB('addRobotPhoto', {
			teamNum: teamNum,
			view: view,
			fileName: fileName
		});
		console.log(result);
		res.json({
			success: true
		});
	} catch (err) {
		logger.debug(`Unable to submit photo`);
		logger.debug(err.stack);
		res.json({
			success: false
		});
	}
});

router.get('/:team_id/:view', function (req, res, next) {

});

module.exports = router;
