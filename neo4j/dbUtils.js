var neo4j = require('neo4j-driver').v1;
const dbConfig = require('../config/config').dbAuth;
var neoDriver = neo4j.driver(dbConfig.url, neo4j.auth.basic(dbConfig.username, dbConfig.password));

exports.getSession = function () {
    return neoDriver.session();
};

exports.endTransaction = function (session) {
    session.close();
}

let teamMetricMapper = (result) => {
    let obj = {};
    for (let i=0; i<result.records.length; i++) {
        let name = result.records[i].get(0).properties.name;
        let val = result.records[i].get(0).properties.values;
        let matchNum = result.records[i].get(1);
        if (obj[matchNum]===undefined) {
            obj[matchNum]={};
        }
        obj[matchNum][name] = val;
	}
    return obj;
}

let teamListMapper = (result) => {
    let obj=[];
    for (let i=0; i<result.records[0].get(0).properties.teams.length; i++) {
        obj[i]=Number(result.records[0].get(0).properties.teams[i]);
	}
    return obj;
}

let qualTeamsMapper = (result) => {
    let obj = [];
    for (let i=0; i<result.records[0].get(0).length; i++) {
        //obj[i]=result.records[0].get(0)[i].low;
        obj[i]=Number(result.records[0].get(0)[i]);
    }
    return obj;
}

let teamAggStatMapper = (result) => {
	let obj={};
	for (let i=0; i<result.records.length; i++) {
		let stat = result.records[i].get(2).properties;
		if(stat.keys) {
			obj[stat.name] = {};
			for (let j=0; j<stat.keys.length; j++) {
				obj[stat.name][stat.keys[j]] = stat.values[j];
			}
		} else {
			if(typeof stat.value === 'object') {
				obj[stat.name] = stat.value.low;
			} else {
				obj[stat.name] = stat.value;
			}
		}
	}
	return obj;
}

let formListMapper = (result) => {
	let obj=[];
	for(let i=0; i<result.records.length; i++) {
		obj[i] = result.records[i].get(0).properties;
	}
	return obj;
}

let propsMapper = (result) => {
	if(result.records[0] === undefined) {
		return {status:'failed'};
	}
	return result.records[0].get(0).properties;
}
let idMapper = (result) => {
	if(result.records[0] === undefined) {
		return -1;
	}
	return result.records[0].get(0);
}

exports.queryDB = async function (queryName, queryParams) {
    const queries = {
		'getTeam': {
			'query':'MATCH (t:Team{num:toInteger($teamNum)}) \
				RETURN team',
			'mapper': propsMapper
		},
		'getTeamAggStats': {
			'query':'MATCH (t:Team{num:toInteger($teamNum)})-[:Performs]->(a:Aggregate{event:$eventId})-[:Specify]->(s:Statistic) \
				RETURN t,a,s',
			'mapper':teamAggStatMapper
		},
        'getTeamList': {
			'query':'MATCH (e:Event{id:$eventId})-[:Hosts]->(l:TeamList) \
				RETURN l',
			'mapper':teamListMapper
		},
        'getQualTeams': {
			'query':'MATCH (e:Event{id:$eventId})-[:Schedules]->(q:Qual{matchNum:$matchNum}) \
				RETURN q.teams',
			'mapper':qualTeamsMapper
		},
        'getFormsForTeam':{
			'query':'MATCH (t:Team{num:toInteger($teamNum)}) WITH t MATCH (t)-[:Plays{active:true}]->(f:Form) \
				RETURN f',
			'mapper':formListMapper
		},
		'getFormMetricsForTeam':{ //TODO: Figure out how to make this query work with replays
			'query':'MATCH (t:Team{num:toInteger($teamNum)})-[:Plays{active:true}]->(f:Form{eventId:$eventId})-[:Do]->(m:Metric) \
				RETURN m, f.matchNum',
			'mapper':teamMetricMapper
		},
		'deactivatePrevForms':{
			'query':'MATCH (t:Team{num:toInteger($teamNum)}) WITH t \
				MATCH (t)-[p:Plays {active:true}]->(f:Form{matchNum:toInteger($matchNum),eventId:$event}) \
				SET p.active=false \
				RETURN f',
			'mapper':propsMapper
		},
		'createNewForm': {
			'query':'MATCH (t:Team{num:toInteger($teamNum)}) \
				CREATE (t)-[:Plays {active:true}]->(f:Form{matchNum:toInteger($matchNum),eventId:$event}) \
				RETURN ID(f)',
			'mapper':idMapper
		},
		'createEventMatches':{
			'query':'MERGE (e:Event{id:$eventId}) \
				WITH e UNWIND $matchList AS q \
				MERGE (e)-[:Schedules]->(:Qual{matchNum:q.num, teams:q.teams}) \
				RETURN e',
			'mapper':propsMapper
		},
		'createEventTeams':{
			'query':'MERGE (e:Event{id:$eventId}) \
				WITH e MERGE (e)-[:Hosts]->(:TeamList{teams:$teamList}) \
				WITH e UNWIND $teamList AS tNum \
				MERGE (t:Team{num:toInteger(tNum)}) \
				RETURN e',
			'mapper':propsMapper
		},
		'createEventTeamAnalytics':{
			'query':'MERGE (e:Event{id:$eventId}) \
				WITH e UNWIND $teamList AS tNum \
				MERGE (t:Team{num:toInteger(tNum)}) \
				WITH e, t MERGE (t)-[:Performs]->(a:Aggregate{event:$eventId}) \
				WITH e, a UNWIND $statList AS statName \
				MERGE (a)-[:Specify]->(s:Statistic{name:statName}) \
				WITH e, s SET s.values=\"N/A\" \
				RETURN e',
			'mapper': propsMapper
		}
	};
    let neoSession = neoDriver.session();
    let result = await neoSession.run(queries[queryName]['query'], queryParams);
    if(queries[queryName]['mapper']!=undefined) {
        result = queries[queryName]['mapper'](result);
    }
    neoSession.close();
    return result;
}
