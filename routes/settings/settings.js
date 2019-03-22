"use strict";
let router = require('express').Router();

router.use('/curEvent', require('./curEvent'));
router.use('/blueSide', require('./blueSide'));
router.use('/userGen', require('./userGen'));

module.exports = router;
