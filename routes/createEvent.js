"use strict";
let router = require('express').Router();
const logger = require("../util/logger");
const eventQuerier = require("../util/event-querier");
const calcQuerier = require('../util/analytics-calc');

router.get('/', function (req, res, next) {
    logger.debug("Create new event");
    res.render('createEvent', {title: 'Create Event'});
});

router.post('/', async function (req, res, next) {
	let newEvent = req.body.eventCode;
	logger.debug(`creating event ${newEvent}`);
	await eventQuerier.createEvent(newEvent);
	let teams = await eventQuerier.getTeams(newEvent);
	for (let team of teams) {
		await calcQuerier.calculateForTeam(team, newEvent);
	}
	logger.debug(`initialized teamList: ${JSON.stringify(teams)}`);

	let curEvent = await eventQuerier.setCurEvent(newEvent);
	logger.debug(`successfully updated curEvent: ${curEvent}`);

    res.redirect('/admin');
});

module.exports = router;
