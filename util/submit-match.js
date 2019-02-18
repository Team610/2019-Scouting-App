"use strict";
let fields = require('../config/formConfig').form_db_interface;
let dbUtils = require('../neo4j/dbUtils');
let logger = require('./logger');
const appConfig = require('../config/appConfig')

exports.submitMatch = async (data) => {
    let neoSession = dbUtils.getSession();
    let status=false;

    try {
        const teamNum = data.teamNum;
        const matchNum = data.matchNum;
        const curEvent = appConfig.curEvent;

        let deactivatePrevForms = await dbUtils.queryDB('deactivatePrevForms', {
				teamNum: teamNum,
				event: curEvent,
				matchNum: matchNum
			});
		logger.debug(`deactivated previous forms: ${deactivatePrevForms}`);

        let newFormId = await dbUtils.queryDB('createNewForm', {
                teamNum: teamNum,
                event: curEvent,
                matchNum: matchNum
			});
		logger.debug(`created new form: ${newFormId}`);

        let stringInjector = (string, inject, end) => {
            return string.substring(0, string.length-end)+inject+string.substring(string.length-end);
        }
        let queryString = "MATCH (f:Form) WHERE ID(f)=$formId";
        //TODO: find a way to get the just-created form without using ID(f)
        for (let field of fields) {
            let fieldQuery = "CREATE (f)-[:Do]->(:Metric)";
            let db_metric_name = field.db_metric_id ? field.db_metric_id : field.form_field_id;

            let dataString;
			if (typeof data[field.form_field_id] === 'object') {
				dataString = `name:"${db_metric_name}",values:${JSON.stringify(data[field.form_field_id])}`;
			} else {
				dataString = `name:"${db_metric_name}",values:["${data[field.form_field_id]}"]`;
			} //TODO: turn this into a util method
			fieldQuery = stringInjector(fieldQuery, "{"+dataString+""+"}", 1);
			queryString += " "+fieldQuery;
        }
        queryString += " RETURN f";

        let result = await neoSession.run(queryString, {
            teamNum: teamNum,
            formId: newFormId
        }); //TODO: move this query to the dbUtils func

        logger.debug(`successfully saved match number ${result.records[0].get(0).properties.matchNum}`);
        status=true;
    } catch (err) {
        logger.debug(err.message);
		logger.debug('failed to save match');
    }
    dbUtils.endTransaction(neoSession);
    
    return status;
}