"use strict";
const request = require('request');
let router = require('express').Router();
const logger = require("../util/logger");
const eventCreator = require("../util/event-creator");
const eventTeams = require('../util/event-teams');
const calcQuerier = require('../util/analytics-calc');
const appConfig = require('../config/appConfig.json');

router.get('/', function (req, res, next) {
    logger.debug("Create new event");
    res.render('createEvent', {title: 'Create Event'});
});

router.post('/', async function (req, res, next) {
	console.log(`creating event ${req.body.eventCode}`);
    let eventCode = req.body.eventCode;
	await eventCreator.createEvent(eventCode);
	let teams = await eventTeams.getTeams(appConfig.curEvent);
	for (let team of teams) {
		await calcQuerier.calculateForTeam(team);
	}
	console.log(`initialized teamList: ${JSON.stringify(teams)}`);
    res.redirect('/admin');
});

module.exports = router;
