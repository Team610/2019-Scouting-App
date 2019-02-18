"use strict";
const request = require('request');
let router = require('express').Router();
const dbUtils = require('../neo4j/dbUtils');
const logger = require("../util/logger");
const querier = require("../util/event-creator");
const appConfig = require("../config/appConfig");

router.get('/', function (req, res, next) {
    logger.debug("Create new event");
    res.render('createEvent', {title: 'Create Event'});
});

router.post('/', function (req, res, next) {
    let eventCode = req.body.eventCode;
    querier.createEvent(eventCode);
    res.redirect('/admin');
});

module.exports = router;
