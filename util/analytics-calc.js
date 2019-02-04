"use strict";
let configs = require('../config/formConfig').db_analytics_agg;
let dbUtils = require('../neo4j/dbUtils');

exports.calculateForTeam = async (teamNum) => {
    logger.debug("calc analytics");
    let neoSession = dbUtils.getSession();

    try {
        const formData = await dbUtils.queryDB('getFormMetricsForTeam', {teamNum:teamNum, event:'2018onosh'}); // TODO: dynamically get event
        for (config of configs) {
            let data = [];
            for (metric of config.metrics) {
                for (match of formData) {
                    data.push(match[metric]);
                }
            }
            for (operator of config.operators) {

            }
        }
    } catch (err) {
        logger.debug(err.message);
        logger.debug('Failed to calculate'); //TODO: if the function fails, need to throw exception and handle error code
    }
	dbUtils.endTransaction(neoSession);
}

let by_instance = function(lists) {
    return lists.flat();
}

let by_match = function(lists, param) {
    for (list of lists) {
        //Call param(list), store into lists
    }
}
