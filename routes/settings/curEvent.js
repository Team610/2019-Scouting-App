"use strict";
const router = require('express').Router();
const logger = require('../../util/logger');
const eventQuerier = require('../../util/event-querier');

router.get('/', async function (req, res, next) {
	logger.debug('Getting current event');
	const e = await eventQuerier.getCurEvent();
	res.json({ event: e, success: typeof e === 'string' || e >= 0 });
});

router.post('/', async function (req, res, next) {
	const event = req.body.eventCode;
	logger.debug(`Setting current event to ${event}`);
	const e = await eventQuerier.setCurEvent(event);
	res.json({ event: e, success: typeof e === 'string' || e >= 0 });
});

module.exports = router;
