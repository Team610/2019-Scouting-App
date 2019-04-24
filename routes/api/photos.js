"use strict";
let router = require('express').Router();
const logger = require("../../util/logger");
const photoQuerier = require('../../util/photo-querier');
const fs = require('fs');
const os = require('os');
const path = require('path');

const photoViews = [
	"back",
	"front",
	"isom",
	"other",
	"side",
	"top"
]; //TODO: put this in a proper config

router.post('/', async function (req, res, next) {
	try { //TODO: secure this API
		const teamNum = Number(req.body.teamNum);
		const view = req.body.view;
		const data = req.body.photo;
		await photoQuerier.addPhoto(teamNum, view, data);
		logger.debug(`successfully saved photo for team ${teamNum}`);
		res.json({ success: true });
	} catch (err) {
		logger.debug(`Unable to submit photo`);
		logger.debug(err.stack);
		res.json({ success: false });
	}
});

router.get('/:team_id/:view', async function (req, res, next) {
	const teamNum = Number(req.params.team_id);
	const view = req.params.view;
	if (!photoViews.includes(view)) {
		console.log('Not a real view!');
		res.json({ success: false });
		return;
	}
	try {
		const photos = await photoQuerier.getPhotos(teamNum, view);
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

router.post('/upload', async function (req, res, next) {
	try {
		const teamNum = Number(req.body.teamNum);
		const view = req.body.view;
		const fileData = req.body.file;
		const fileName = req.body.name;
		const postfix = `${teamNum}_${view}_${fileName}`;
		let filePath;
		if (os.type().includes('indows')) {
			filePath = path.normalize(`${__dirname}\\..\\..\\public\\images\\${postfix}`);
		} else {
			filePath = path.normalize(`${__dirname}/../../public/images/${postfix}`);
		}
		
		fs.writeFileSync(filePath, fileData);

		photoQuerier.addPhoto(teamNum, view, filePath);
		
		logger.debug(`successfully saved photo for team ${teamNum} at ${filePath}`);
		res.json({ success: true });
	} catch (err) {
		logger.debug(`Unable to submit photo`);
		logger.debug(err.stack);
		res.json({ success: false });
	}
});

module.exports = router;
