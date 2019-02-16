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
	console.log(obj);
    return obj;
}

let qualTeamMapper = (result) => {
    let obj = [];
    for (let i=0; i<result.records[0].get(0).length; i++) {
        obj[i]=result.records[0].get(0)[i].low;
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

exports.queryDB = async function (queryName, queryParams) {
    const queries = {
		'getTeam': {'query':'MATCH (t:Team{num:toInteger($teamNum)}) RETURN team'},
		'getTeamAggStats': {'query':'MATCH (t:Team{num:toInteger($teamNum)})-[:Performs]->(a:Aggregate{event:$eventId})-[:Specify]->(s:Statistic) RETURN t,a,s', 'mapper':teamAggStatMapper},
        'getTeamList': {'query':'MATCH (e:Event{id:$eventId})-[:Hosts]->(l:TeamList) RETURN l', 'mapper':teamListMapper},
        'getQualTeams': {'query':'MATCH (e:Event{id:$eventId})-[:Schedules]->(q:Qual{matchNum:$matchNum}) RETURN q.teams', 'mapper':qualTeamMapper},
        'getFormsForTeam':{'query':'MATCH (t:Team{num:toInteger($teamNum)}) WITH t MATCH (t)-[:Plays{active:true}]->(f:Form) RETURN f'},
		'getFormMetricsForTeam':{'query':'MATCH (t:Team{num:toInteger($teamNum)})-[:Plays{active:true}]->(f:Form{eventId:$eventId})-[:Do]->(m:Metric) RETURN m, f.matchNum', 'mapper':teamMetricMapper}, //TODO: Figure out how to make this query work with replays
		'createEventMatches':{}
    };
    let neoSession = neoDriver.session();
    let result = await neoSession.run(queries[queryName]['query'], queryParams);
    if(queries[queryName]['mapper']!=undefined) {
        result = queries[queryName]['mapper'](result);
    }
    neoSession.close();
    return result;
}
