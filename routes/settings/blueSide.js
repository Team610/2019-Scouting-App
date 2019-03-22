"use strict";
let router = require('express').Router();
const logger = require('../../util/logger');
const blueQuerier = require('../../util/blue-querier');

router.get('/', async function (req, res, next) {
	logger.debug('Blue side of field');
	try {
		const blueSide = await blueQuerier.getBlueSide();
		res.json({
			blueSide: blueSide,
			success: true
		});
	} catch (err) {
		logger.debug('Could not get blue side');
		logger.debug(err.stack);
		res.json({ success: false });
	}
});

router.post('/', async function (req, res, next) {
	const side = req.body.side;
	logger.debug(`Setting blue side of field to ${side}`);
	if (side !== 'left' && side !== 'right') {
		logger.debug(`Invalid side: ${side}`);
		res.json({ success: false });
	} else {
		try {
			const blueSide = await blueQuerier.setBlueSide(side);
			res.json({
				blueSide: blueSide,
				success: true
			});
		} catch (err) {
			logger.debug(`Could not set blue side to ${side}`);
			logger.debug(err.stack);
			res.json({ success: false });
		}
	}
});

module.exports = router;
