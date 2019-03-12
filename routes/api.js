"use strict";
let router = require('express').Router();

router.use('/v1/stats', require('./api/stats'));
router.use('/v1/matches', require('./api/matches'));
router.use('/v1/submitForm', require('./api/submit'));
router.use('/v1/event', require('./api/event'));
router.use('/v1/photos', require('./api/photos'));

module.exports = router;
