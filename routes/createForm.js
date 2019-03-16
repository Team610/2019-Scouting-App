"use strict";
let router = require('express').Router();
const logger = require('../util/logger');
const matchQuerier = require('../util/match-querier');
let fields = require('../config/formConfig.json').form_db_interface;

router.get('/', function (req, res, next) {
	logger.debug('Create new form');
	res.render('createForm', {title: 'Create Form'});
});

router.post('/', async function(req, res, next) {
	let data = {
		teamNum: req.body.teamNum,
		matchNum: req.body.matchNum
	};
	logger.debug(`Creating new form for team ${data.teamNum} in match ${data.matchNum}`);
	for(let field of fields) {
		data[field.form_field_id] = field.type==='enum' ? 'blank' : [];
	}
	await matchQuerier.submitMatch(data);

	res.redirect('/admin');
});

module.exports = router;
