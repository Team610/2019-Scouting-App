"use strict";
let router = require('express').Router();
let logger = require('../util/logger');
let querier = require('../util/user-gen');

router.get('/', async function(req, res, next) {
	try {
		logger.debug(`user gen starting`);
		await querier.generateUsers();
		res.json({success: true});
	} catch (err) {
		logger.debug(`could not generate users: ${err.stack}`);
	}
});

module.exports = router;
