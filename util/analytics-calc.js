"use strict";
let configs = require('../config/formConfig').db_analytics_agg;
let dbUtils = require('../neo4j/dbUtils');
let logger = require('./logger');
let appConfig = require('../config/appConfig');

exports.calculateForTeam = async (teamNum) => {
    logger.debug(`calculating analytics for team ${teamNum}`);
    let neoSession = dbUtils.getSession();

    try {
		const formData = await dbUtils.queryDB('getFormMetricsForTeam', {teamNum:teamNum, eventId:appConfig.curEvent});
		// console.log(formData);
        let queryString = "MATCH (t:Team{num:toInteger($teamNum)})-[:Performs]->(a:Aggregate{event:$event})";
        for (let config of configs) {
            // console.log("trying "+config.name);
            let data = [];
			let dataQuery = "";
			if(config.operators[0].type === 'cond') {
				for(let matchNum of Object.keys(formData)) {
					let condKey = Object.keys(config.operators[0].cond)[0];
					let condVal = Object.values(config.operators[0].cond)[0];
					if(formData[matchNum][condKey] === condVal) {
						for(let metric of config.metrics) {
							data.push(formData[matchNum][metric]);
						}
					}
				}
			} else {
				for (let metric of config.metrics) {
					for (let matchNum of Object.keys(formData)) {
						// console.log(`metric: ${metric}\tkey: ${key}\tformData[key][metric]: ${JSON.stringify(formData[key][metric])}`);
						data.push(formData[matchNum][metric]);
					}
				}
			}

            // console.log(`raw data: ${JSON.stringify(data)}, typeof: ${typeof data}`);
            if(config.operators[0].func === 'by_instance') {
                data = by_instance(data);
            } else if (config.operators[0].func === 'by_match') {
                data = by_match(data, config.operators[0].params[0]);
            } else if (config.operators[0].func === 'count_by_type') {
				console.log(`config: ${config.name}`);
                data = count_by_type(data);
                dataQuery = `MATCH (a)-[:Specify]->(s:Statistic{name:'${config.name}'}) `+
					`SET s.keys=[${Object.keys(data).map(x => "'"+x+"'").toString()}], ` +
					`s.values=[${Object.values(data).map(x => "'"+x+"'").toString()}]`;
                queryString += " WITH t, a "+dataQuery;
                // console.log(`processed data: ${JSON.stringify(data)}, typeof: ${typeof data}\n`);
                continue;
			} else {
                throw {message:"config incorrectly set up"};
            }

            if(config.operators[1].func == 'avg') {
                data = func_avg(data);
            } else if (config.operators[1].func == 'sum') {
                data = func_sum(data);
            } else if (config.operators[1].func == 'count') {
                data = func_count(data);
            }

            dataQuery = `MATCH (a)-[:Specify]->(s:Statistic{name:'${config.name}'}) SET s.value=${JSON.stringify(data)} REMOVE s.values`;
            // console.log(`processed data: ${data}, typeof: ${typeof data}\n`);
            queryString += " WITH t, a "+dataQuery;
        }
        queryString += " RETURN t";
		// console.log(queryString);
		// console.log(`teamNum: ${teamNum}, event: ${appConfig.curEvent}`)
        let team = await neoSession.run(queryString, {teamNum:teamNum, event:appConfig.curEvent});
        logger.debug(`successfully calculated for team ${team.records[0].get(0).properties.num}`);
    } catch (err) {
        logger.debug(err.stack);
        logger.debug(`Failed to calculate for team ${teamNum}`); //TODO: if the function fails, need to throw exception and handle error code
    }
	dbUtils.endTransaction(neoSession);
}

let by_instance = function(lists) {
    // console.log("by_instance");
    // console.log("input: "+ lists);
    let result = [];
    for (let i=0; i<lists.length; i++) {
        for (let j=0; j<lists[i].length; j++) {
            result.push(lists[i][j]);
        }
    }
    // console.log("output: "+result);
    return result;
}

let by_match = function(lists, param) {
    // console.log("by_match, "+param);
    // console.log("input: "+lists);
    for (let list in lists) {
        if(param == 'sum') {
            lists[list] = func_sum(lists[list]);
        } else if(param == 'avg') {
            lists[list] = func_avg(lists[list]);
        } else if(param == 'count') {
            lists[list] = func_count(lists[list]);
        }
    }
    // console.log("output: "+lists);
    return lists;
}

let func_count = function(list) {
    // console.log(`count\ninput: ${list}\noutput: ${list.length}`);
    return list.length;
}

let func_avg = function(list) {
    // console.log("avg");
	// console.log("input: "+list);
	if (list.length==0) {
		return 0;
	}
    let sum=0;
    for (let i=0; i<list.length; i++) {
        sum+=list[i];
    }
    // console.log("output: "+ sum/list.length);
    return sum/list.length;
}

let func_sum = function(list) {
    // console.log("sum");
    // console.log("input: "+list);
    let sum=0;
    for (let i=0; i<list.length; i++) {
        sum+=Number(list[i]);
    }
    // console.log("output: "+sum);
    return sum;
}

let count_by_type = function (list) {
    list = by_instance(list);
    // console.log("count_by_type");
    // console.log(`input: ${JSON.stringify(list)}\ttypeof: ${typeof list}\tlength: ${list.length}`);
    let result = {};
    for (let i=0; i<list.length; i++) {
        if(result[list[i]]) {
            result[list[i]]++;
        } else {
            result[list[i]] = 1;
        }
    }
    // console.log("output: "+ result);
    return result;
}
