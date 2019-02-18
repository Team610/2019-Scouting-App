"use strict";
const request = require('request');
let router = require('express').Router();
const logger = require("../util/logger");
const querier = require("../util/event-creator");

router.get('/', function (req, res, next) {
    logger.debug("Create new event");
    res.render('createEvent', {title: 'Create Event'});
});

router.post('/', function (req, res, next) {
	console.log(`creating event ${req.body.eventCode}`);
    let eventCode = req.body.eventCode;
    querier.createEvent(eventCode);
    res.redirect('/admin');
});

module.exports = router;
