"use strict";
let configs = require('../config/formConfig').db_analytics_agg;
let dbUtils = require('../neo4j/dbUtils');
let logger = require('./logger');

exports.calculateForTeam = async (teamNum) => {
    logger.debug("calc analytics");
    let neoSession = dbUtils.getSession();

    try {
        const formData = await dbUtils.queryDB('getFormMetricsForTeam', {teamNum:teamNum, event:'2018onosh'}); // TODO: dynamically get event
        let queryString = "MATCH (t:Team{num:$teamNum})-[:Performs]->(a:Aggregate{event:$event})";
        for (let config of configs) {
            // console.log("trying "+config.name);
            let data = [];
            let dataQuery = "";
            for (let metric of config.metrics) {
                for (let key of Object.keys(formData)) {
                    // console.log(`metric: ${metric}\tkey: ${key}\tformData[key][metric]: ${JSON.stringify(formData[key][metric])}`);
                    data.push(formData[key][metric]);
                }
            }

            // console.log(`raw data: ${data}, typeof: ${typeof data}`);

            if(config.operators[0].func == 'by_instance') {
                data = by_instance(data);
            } else if (config.operators[0].func == 'by_match') {
                data = by_match(data, config.operators[0].params[0]);
            } else if (config.operators[0].func == 'count_by_type') {
                data = count_by_type(data);
                dataQuery = `MATCH (a)-[:Specify]->(s:Statistic{name:'${config.name}'}) `+
                    `SET s.keys=[${Object.keys(data).map(x => "'"+x+"'").toString()}], s.values=[${Object.values(data).map(x => "'"+x+"'").toString()}]`;
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

            dataQuery = `MATCH (a)-[:Specify]->(s:Statistic{name:'${config.name}'}) SET s.value=${JSON.stringify(data)}`;
            // console.log(`processed data: ${data}, typeof: ${typeof data}\n`);
            queryString += " WITH t, a "+dataQuery;
        }
        queryString += " RETURN t";
        // console.log(queryString);
        await neoSession.run(queryString, {teamNum:teamNum, event:'2018onosh'});
        logger.debug("successfully calculated");
    } catch (err) {
        logger.debug(err.message);
        logger.debug('Failed to calculate'); //TODO: if the function fails, need to throw exception and handle error code
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
