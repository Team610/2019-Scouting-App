"use strict";
const fields = require('../config/formConfig').form_db_interface;
const dbUtils = require('../neo4j/dbUtils');
const logger = require('./logger');
const stringUtils = require('../util/stringUtils');
const eventQuerier = require('./event-querier');

exports.getTeamsForMatch = async (matchNum, event) => {
	if (event === undefined)
		event = await eventQuerier.getCurEvent();
	const teams = await dbUtils.queryDB('getQualTeams', { eventId: event, matchNum: matchNum });
	return teams;
}

exports.submitMatch = async (data, event) => {
	if (event === undefined)
		event = await eventQuerier.getCurEvent();
	let neoSession = dbUtils.getSession();
	let status = false;

	try {
		const teamNum = data.teamNum;
		const matchNum = data.matchNum;

		let deactivatePrevForms = await dbUtils.queryDB('deactivatePrevForms', {
			teamNum: teamNum,
			eventId: event,
			matchNum: matchNum
		});
		logger.debug(`deactivated previous forms: ${JSON.stringify(deactivatePrevForms)}`);

		let newFormId = await dbUtils.queryDB('createNewForm', {
			teamNum: teamNum,
			eventId: event,
			matchNum: matchNum
		});
		logger.debug(`created new form: ${newFormId}`);

		let queryString = "MATCH (f:Form) WHERE ID(f)=$formId";
		//TODO: find a way to get the just-created form without using ID(f)
		for (let field of fields) {
			let fieldQuery = "CREATE (f)-[:Do]->(:Metric)";
			let db_metric_name = field.db_metric_id ? field.db_metric_id : field.form_field_id;

			//For each field in the config, add to the query string 'CREATE (NODE {NAME, VALUES})'
			let dataString;
			if (db_metric_name === 'other_comments') {
				dataString = `name: "${db_metric_name}",values: ["${stringUtils.escape(data[field.form_field_id])}"]`;
			} else if (typeof data[field.form_field_id] === 'object') {
				dataString = `name:"${db_metric_name}",values:${JSON.stringify(data[field.form_field_id])}`;
			} else {
				dataString = `name:"${db_metric_name}",values:["${data[field.form_field_id]}"]`;
			}
			fieldQuery = stringUtils.inject(fieldQuery, "{" + dataString + "}", -1);
			queryString += " " + fieldQuery;
		}
		queryString += " RETURN f";

		let result = await neoSession.run(queryString, {
			teamNum: teamNum,
			formId: newFormId
		}); //TODO: move this query to the dbUtils func

		logger.debug(`successfully saved match number ${result.records[0].get(0).properties.matchNum}`);

		let userQualRel = await dbUtils.queryDB('markUserQualRelDone', {
			userEmail: data.user.email,
			matchNum: matchNum,
			eventId: event
		});
		if (userQualRel[0])
			logger.debug(`successfully moved user ${userQualRel[0].user.name}'s match forward`);

		status = true;
	} catch (err) {
		logger.debug(err.stack);
		logger.debug('failed to save match');
	}
	dbUtils.endTransaction(neoSession);

	return status;
}
