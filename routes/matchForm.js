"use strict";
const matchFormConfig = require('../config/matchFormConfig.json');
const request = require('request');
let router = require('express').Router();
const dbUtils = require('../neo4j/dbUtils');
const logger = require("../util/logger");
const fields = require('../config/formConfig.json').form_db_interface;

router.get('/', async function(req, res, next) {
	logger.debug("Getting match form");
	let neoSession = dbUtils.getSession();
	let result = await neoSession.run("MATCH (e:Event)-[:Schedules]->(q:Qual) WHERE q.matchNum=1 RETURN q.teams");
	let teams = result.records[0].get(0);
	dbUtils.endTransaction(neoSession);
	res.render('matchForm', { title: 'Match Form', teamList: teams, matchFormConfig: matchFormConfig });
});

router.post('/', async function(req, res, next) {
	let neoSession = dbUtils.getSession();
	logger.debug('saving match '+parseInt(req.body.matchNum));

	//Mock data
	let curEvent = "2018onosh";
	let data = {
		"cycle_cargo_lv1": [10.566, 8.03],
		"cycle_cargo_lv2": [1.44],
		"cycle_cargo_lv3": [],
		"cycle_cargo_lvS": [2.4],
		"cycle_hatch_lv1": [10.566, 8.03],
		"cycle_hatch_lv2": [1.44],
		"cycle_hatch_lv3": [],
		"cycle_hatch_lvS": [2.4],
		"climb_lvl": "2",
		"climb_time": 1.44,
		"robot_preload":"hatch",
		"ship_preloads":["hatch","cargo"],
		"start_on_lvl_2":true,
		"def_rocket_goalkeep":1.8,
		"def_ship_goalkeep":0,
		"def_pinning":0,
		"def_tough_defense":3,
		"def_driving_around":0,
		"comments":["some comments here"]
	};

	try {
		//Deactivate any previous matches with the same match number
		let deactivatePrevMatches = await neoSession.run("MATCH (t:Team{num:toInteger($teamNum)}) WITH t " +
			"MATCH (t)-[p:Plays {active:true}]->(f:Form{matchNum:toInteger($matchNum),eventId:$event}) "+
			"SET p.active=false "+
			"RETURN f",
			{
				teamNum: req.body.teamNum,
				event: curEvent,
				matchNum: req.body.matchNum
			});
			// console.log("successfully deactivated");
		//Create a Match node for the latest submitted Match
		let createLastMatch = await neoSession.run("MATCH (t:Team{num:toInteger($teamNum)}) "+
			"CREATE (t)-[:Plays {active:true}]->(f:Form{matchNum:toInteger($matchNum),eventId:$event}) "+
			"RETURN ID(f)",
			{
				teamNum: req.body.teamNum,
				event: curEvent,
				matchNum: req.body.matchNum
			});
			// console.log("successfully created");
		//Defining a query modifier method
		let queryModifier = (query, string, end) => {
			return query.substring(0,query.length-end)+string+query.substring(query.length-end);
		}
		//Create a new list of nodes based on the formConfig, attached to the match node
		let queryString = "MATCH (t:Team{num:toInteger($teamNum)})-[:Plays]->(f:Form) WHERE ID(f)=$formId";
		for(let field of fields) {
			// console.log(field);
			let fieldQuery = "CREATE (f)-[:Do]->(:Metric)";
			let db_metric_name = field.db_metric_id ? field.db_metric_id : field.form_field_id;

			//Create a string for the data properties of the node
			let dataString;
			if (typeof data[field.form_field_id] === 'object') {
				dataString = `name:"${db_metric_name}",values:${JSON.stringify(data[field.form_field_id])}`;
			} else {
				dataString = `name:"${db_metric_name}",values:["${data[field.form_field_id]}"]`;
			} //TODO: turn this into a util method
			fieldQuery = queryModifier(fieldQuery, "{"+dataString+""+"}", 1);
			queryString += " "+fieldQuery;
			console.log(fieldQuery);
		}
		queryString += " RETURN f";
		// console.log(queryString);

		let result = await neoSession.run(queryString, {
			teamNum: req.body.teamNum,
			formId: createLastMatch.records[0].get(0)
		});

		logger.debug('successfully saved match number '+result.records[0].get(0).properties.matchNum);
	} catch (err) {
		logger.debug(err.message);
		logger.debug('failed to save match');
	}
	dbUtils.endTransaction(neoSession);

	res.redirect('/');
});

module.exports = router;
