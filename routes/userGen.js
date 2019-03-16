"use strict";
let router = require('express').Router();
const logger = require('../util/logger');
const querier = require('../util/user-querier');

router.get('/', async function (req, res, next) {
	try {
		logger.debug(`user gen starting`);
		await querier.generateUsers();
		res.json({ success: true });
	} catch (err) {
		logger.debug(`could not generate users: ${err.stack}`);
		res.json({ success: false });
	}
});

module.exports = router;
