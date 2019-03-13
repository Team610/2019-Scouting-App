"use strict";
let router = require('express').Router();
const logger = require("../../util/logger"); //TODO: make this path more absolute
const dbUtils = require('../../neo4j/dbUtils');

router.post('/', async function (req, res, next) {
	try { //TODO: secure this API
		const teamNum = Number(req.body.teamNum);
		const view = req.body.view;
		const data = req.body.photo;
		let team = await dbUtils.queryDB('addRobotPhoto', {
			teamNum: teamNum,
			view: view,
			photoData: data,
			time: new Date().getTime()
		});
		logger.debug(`successfully saved photo for team ${team.num}`);
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

router.get('/:team_id/:view', async function (req, res, next) {
	try {
		const teamNum = Number(req.params.team_id);
		const view = req.params.view;
		const photos = await dbUtils.queryDB('getRobotPhotos', {
			teamNum: teamNum,
			view: view
		});
		logger.debug(`got ${photos.length} photos`);
		res.json({
			success: true,
			photos: photos
		});
	} catch (err) {
		logger.debug(`Unable to get photos`);
		logger.debug(err.stack);
		res.json({
			success: false
		});
	}
});

module.exports = router;
