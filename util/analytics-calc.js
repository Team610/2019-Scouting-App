"use strict";
let configs = require('../config/formConfig').db_analytics_agg;
const dbUtils = require('../neo4j/dbUtils');
const stringUtils = require('./stringUtils');
const eventQuerier = require('./event-querier');
const logger = require('./logger');

let calculateForTeam = exports.calculateForTeam = async (teamNum, event) => {
	if (event === undefined)
		event = await eventQuerier.getCurEvent();
	logger.debug(`calculating analytics for team ${teamNum}`);
	let neoSession = dbUtils.getSession(); //TODO: find a way to abstract the query

	try {
		const formData = await dbUtils.queryDB('getFormMetricsForTeam', { teamNum: teamNum, eventId: event });
		// console.log(formData);
		let queryString = "MATCH (t:Team{num:toInteger($teamNum)})-[:Performs]->(a:Aggregate{event:$event})";
		for (let config of configs) {
			// console.log("trying " + config.name);

			let data = [];
			let dataQuery = "";
			if (config.operators[0].type === 'cond') {
				let condKey = Object.keys(config.operators[0].cond)[0];
				let condVal = Object.values(config.operators[0].cond)[0];
				for (let matchNum of Object.keys(formData)) {
					if (formData[matchNum][condKey] == condVal) {
						let matchData = [];
						for (let metric of config.metrics) {
							// console.log(`metric: ${metric}\tkey: ${matchNum}\tformData[key][metric]: ${JSON.stringify(formData[matchNum][metric])}`);
							for (let val of formData[matchNum][metric]) {
								matchData.push(val);
							}
						}
						data.push(matchData);
					}
				}
			} else {
				for (let matchNum of Object.keys(formData)) {
					let matchData = [];
					for (let metric of config.metrics) {
						// console.log(`metric: ${metric}\tkey: ${matchNum}\tformData[matchNum][metric]: ${JSON.stringify(formData[matchNum][metric])}`);
						for (let val of formData[matchNum][metric]) {
							matchData.push(val);
						}
					}
					data.push(matchData);
				}
			}

			// console.log(`raw data: ${JSON.stringify(data)}, type: ${typeof data}`);
			if (config.operators[0].func === 'by_instance') {
				data = by_instance(data);
			} else if (config.operators[0].func === 'by_match') {
				data = by_match(data, config.operators[0].params[0]);
			} else if (config.operators[0].func === 'count_by_type') {
				data = count_by_type(data);
				dataQuery = `MATCH (a)-[:Specify]->(s:Statistic{name:'${config.name}'}) ` +
					`SET s.keys=[${Object.keys(data).map(x => `'${stringUtils.escape(x)}'`).toString()}], ` +
					`s.values=[${Object.values(data).map(x => `'${stringUtils.escape(x)}'`).toString()}]`;
				queryString += " WITH t, a " + dataQuery;
				// console.log(`processed data: ${JSON.stringify(data)}, type: ${typeof data}\n`);
				continue;
			} else {
				throw { message: "config incorrectly set up" };
			}
			// console.log(`intermediate data: ${JSON.stringify(data)}, type: ${typeof data}`);

			if (config.operators[1].func === 'avg') {
				data = func_avg(data);
			} else if (config.operators[1].func === 'sum') {
				data = func_sum(data);
			} else if (config.operators[1].func === 'count') {
				data = func_count(data);
			} else if (config.operators[1].func === 'nToOne') {
				data = n_to_one(data);
			}

			dataQuery = `MATCH (a)-[:Specify]->(s:Statistic{name:'${config.name}'}) SET s.value=${JSON.stringify(data)} REMOVE s.values`;
			// console.log(`processed data: ${data}, type: ${typeof data}\n`);
			queryString += " WITH t, a " + dataQuery;
		}
		queryString += " RETURN t";
		// console.log(queryString);
		// console.log(`teamNum: ${teamNum}, event: ${event}`);
		let team = await neoSession.run(queryString, { teamNum: teamNum, event: event });
		team = team.records[0].get(0).properties.num;
		logger.debug(`successfully calculated for team ${team}`);
		dbUtils.endTransaction(neoSession);
		return team;
	} catch (err) {
		logger.debug(err.stack);
		logger.debug(`Failed to calculate for team ${teamNum}`);
		dbUtils.endTransaction(neoSession);
		return -1;
	}
}

exports.calculateForAll = async (event) => {
	if (event === undefined)
		event = await eventQuerier.getCurEvent();
	let teams = await eventQuerier.getTeams(event);
	for (let team of teams) {
		const resNum = await calculateForTeam(team);
		if (resNum < 0)
			return -1;
	}
	return 0;
}

const by_instance = function (lists) {
	// console.log("by_instance");
	// console.log("input: "+ lists);
	let result = [];
	for (let i = 0; i < lists.length; i++) {
		for (let j = 0; j < lists[i].length; j++) {
			result.push(lists[i][j]);
		}
	}
	// console.log("output: "+result);
	return result;
}

const by_match = function (lists, param) {
	// console.log("by_match, "+param);
	// console.log("input: "+lists);
	for (let list in lists) {
		if (param == 'sum') {
			lists[list] = func_sum(lists[list]);
		} else if (param == 'avg') {
			lists[list] = func_avg(lists[list]);
		} else if (param == 'count') {
			lists[list] = func_count(lists[list]);
		} else if (param == 'nToOne') {
			lists[list] = n_to_one(lists[list]);
		}
	}
	// console.log("output: "+lists);
	return lists;
}

const func_count = function (list) {
	// console.log(`count\ninput: ${list}\noutput: ${list.length}`);
	let count = 0;
	for (let i = 0; i < list.length; i++) {
		if (list[i] !== 0) {
			count++;
		}
	}
	return count;
}

const func_avg = function (list) {
	// console.log("avg");
	// console.log("input: "+list);
	if (list.length == 0) {
		return 0;
	}
	let sum = 0;
	for (let i = 0; i < list.length; i++) {
		sum += Number(list[i]);
	}
	// console.log("output: "+ sum/list.length);
	return sum / list.length;
}

const func_sum = function (list) {
	// console.log("sum");
	// console.log("input: "+list);
	let sum = 0;
	for (let i = 0; i < list.length; i++) {
		sum += Number(list[i]);
	}
	// console.log("output: "+sum);
	return sum;
}

const n_to_one = function (list) {
	for (let i = 0; i < list.length; i++) {
		if (Number(list[i]) >= 0)
			return 1;
	}
	return 0;
}

const count_by_type = function (list) {
	list = by_instance(list);
	// console.log("count_by_type");
	// console.log(`input: ${JSON.stringify(list)}\ttype: ${typeof list}\tlength: ${list.length}`);
	let result = {};
	for (let i = 0; i < list.length; i++) {
		if (result[list[i]]) {
			result[list[i]]++;
		} else {
			result[list[i]] = 1;
		}
	}
	// console.log("output: "+ result);
	return result;
}
