"use strict";
let router = require('express').Router();
const logger = require('../util/logger');
const calcQuerier = require('../util/analytics-calc');
const eventQuerier = require('../util/event-querier');

router.get('/', async function(req, res, next) {
	const list = await eventQuerier.getTeams();
    try {
        for (let team of Object.values(list)) {
            await calcQuerier.calculateForTeam(team);
        }
    } catch (err) {
        logger.debug(err.message);
        logger.debug("could not calculate analytics");
    }
    res.redirect('/admin');
});

router.get('/:team_id', async function (req, res, next) {
    let team = req.params.team_id;
    try {
        await calcQuerier.calculateForTeam(team);
    } catch (err) {
        logger.debug(err.message);
        logger.debug("could not calculate analytics");
    }
    res.redirect('/admin');
});

module.exports = router;
