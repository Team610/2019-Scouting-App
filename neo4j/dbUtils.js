var neo4j = require('neo4j-driver').v1;
const dbConfig = require('../config/config').dbAuth;
var neoDriver = neo4j.driver(dbConfig.url, neo4j.auth.basic(dbConfig.username, dbConfig.password));
const scoutsJsonPath = "https://raw.githubusercontent.com/Team610/2019-Scouting-App/dev/config/scouts.json"

exports.getSession = function () {
	return neoDriver.session();
};

exports.endTransaction = function (session) {
	session.close();
}

const mappers = {
	teamMetric: (result) => {
		let obj = {};
		for (let i = 0; i < result.records.length; i++) {
			let name = result.records[i].get(0).properties.name;
			let val = result.records[i].get(0).properties.values;
			let matchNum = result.records[i].get(1);
			if (obj[matchNum] === undefined) {
				obj[matchNum] = {};
			}
			obj[matchNum][name] = val;
		}
		return obj;
	},
	teamList: (result) => {
		let obj = [];
		let teams = result.records[0].get(0).properties.teams;
		for (let i = 0; i < teams.length; i++) {
			obj[i] = Number(teams[i]);
		}
		return obj;
	},
	qualTeams: (result) => {
		let obj = [];
		if (result.records[0] === undefined) {
			return { success: false };
		}
		for (let i = 0; i < result.records[0].get(0).length; i++) {
			obj[i] = typeof result.records[0].get(0)[i] === 'object' ?
				result.records[0].get(0)[i].low :
				Number(result.records[0].get(0)[i]);
		}
		return obj;
	},
	teamAggStat: (result) => {
		let obj = {};
		for (let i = 0; i < result.records.length; i++) {
			let stat = result.records[i].get(2).properties;
			if (stat.keys) {
				obj[stat.name] = {};
				for (let j = 0; j < stat.keys.length; j++) {
					obj[stat.name][stat.keys[j]] = stat.values[j];
				}
			} else {
				if (typeof stat.value === 'object') {
					obj[stat.name] = stat.value.low;
				} else {
					obj[stat.name] = stat.value ? stat.value : stat.values;
				}
			}
		}
		return obj;
	},
	formList: (result) => {
		let obj = [];
		for (let i = 0; i < result.records.length; i++) {
			obj[i] = result.records[i].get(0).properties;
		}
		return obj;
	},
	userQual: (result) => {
		let obj = {};
		for (let i = 0; i < result.records.length; i++) {
			let user = result.records[i].get(0).properties;
			let qual = result.records[i].get(1).properties;
			if (obj[user.email] === undefined) {
				obj[user.email] = [];
			}
			obj[user.email].push(qual);
		}
		return obj;
	},
	qualRel: (result) => {
		let arr = {};
		for (let i = 0; i < result.records.length; i++) {
			let qual = result.records[i].get(0).properties;
			let rel = result.records[i].get(1).properties;
			arr[i] = {
				qual: qual,
				rel: rel
			}
		}
		return arr;
	},
	userRel: (result) => {
		let arr = [];
		for (let i = 0; i < result.records.length; i++) {
			let user = result.records[i].get(0).properties;
			let rel = result.records[i].get(1).properties;
			arr[i] = {
				user: user,
				rel: rel
			}
		}
		return arr;
	},
	props: (result) => {
		if (result.records[0] === undefined) {
			return { status: 'failed' };
		}
		return result.records[0].get(0).properties;
	},
	id: (result) => {
		if (result.records[0] === undefined) {
			return -1;
		}
		return result.records[0].get(0);
	},
	event: (result) => {
		if (result.records[0] === undefined) {
			return -1;
		}
		return result.records[0].get(0).properties.id;
	},
	photos: (result) => {
		let arr = [];
		for (let record of result.records) {
			arr.push(record.get(0).properties.photoData);
		}
		return arr;
	}
}

exports.queryDB = async function (queryName, queryParams) {
	const queries = {
		'getCurEvent': {
			'query': 'MATCH (e:Event {active:true}) \
				RETURN e',
			'mapper': 'event'
		},
		'setCurEvent': {
			'query': 'MATCH (aE:Event {active:true}) \
				SET aE.active = false WITH aE \
				MATCH (nE:Event {id:$eventId}) \
				SET nE.active = true \
				RETURN nE',
			'mapper': 'event'
		},
		'getTeam': {
			'query': 'MATCH (t:Team {num:toInteger($teamNum)}) \
				RETURN t',
			'mapper': 'props'
		},
		'getTeamAggStats': {
			'query': 'MATCH (t:Team {num:toInteger($teamNum)})-[:Performs]->(a:Aggregate {event:$eventId})-[:Specify]->(s:Statistic) \
				RETURN t,a,s',
			'mapper': 'teamAggStat'
		},
		'getTeamList': {
			'query': 'MATCH (e:Event {id:$eventId})-[:Hosts]->(l:TeamList) \
				RETURN l',
			'mapper': 'teamList'
		},
		'getQualTeams': {
			'query': 'MATCH (e:Event {id:$eventId})-[:Schedules]->(q:Qual {matchNum:$matchNum}) \
				RETURN q.teams',
			'mapper': 'qualTeams'
		},
		'getFormsForTeam': {
			'query': 'MATCH (t:Team{num:toInteger($teamNum)}) WITH t MATCH (t)-[:Plays{active:true}]->(f:Form) \
				RETURN f',
			'mapper': 'formList'
		},
		'getFormMetricsForTeam': { //TODO: Figure out how to make this query work with replays
			'query': 'MATCH (t:Team{num:toInteger($teamNum)})-[:Plays{active:true}]->(f:Form{eventId:$eventId})-[:Do]->(m:Metric) \
				RETURN m, f.matchNum',
			'mapper': 'teamMetric'
		},
		'deactivatePrevForms': {
			'query': `MATCH (t:Team{num:toInteger($teamNum)}) WITH t 
				MATCH (t)-[p:Plays {active:true}]->(f:Form{matchNum:toInteger($matchNum),eventId:$eventId}) 
				SET p.active=false 
				RETURN f`,
			'mapper': 'props'
		},
		'createNewForm': {
			'query': `MATCH (t:Team{num:toInteger($teamNum)})
				CREATE (t)-[:Plays {active:true}]->(f:Form{matchNum:toInteger($matchNum),eventId:$eventId})
				RETURN ID(f)`,
			'mapper': 'id'
		},
		'markUserQualRelDone': {
			'query': `MATCH (u:User{email:$userEmail})-[r:Scouts]->(q:Qual{matchNum:$matchNum})<-[:Schedules]-(e:Event{id:$eventId})
				SET r.submitted = true
				RETURN u, r`,
			'mapper': 'userRel'
		},
		'createEventMatches': {
			'query': `MERGE (e:Event{id:$eventId})
				WITH e UNWIND $matchList AS q
				MERGE (e)-[:Schedules]->(:Qual{matchNum:q.num, teams:q.teams})
				RETURN e`,
			'mapper': 'props'
		},
		'createEventTeams': {
			'query': `MERGE (e:Event{id:$eventId})
				WITH e MERGE (e)-[:Hosts]->(:TeamList{teams:$teamList})
				WITH e UNWIND $teamList AS tNum
				MERGE (t:Team{num:toInteger(tNum)})
				RETURN e`,
			'mapper': 'props'
		},
		'createEventTeamAnalytics': {
			'query': `MERGE (e:Event{id:$eventId})
				WITH e UNWIND $teamList AS tNum
				MERGE (t:Team{num:toInteger(tNum)})
				WITH e, t MERGE (t)-[:Performs]->(a:Aggregate{event:$eventId})
				WITH e, a UNWIND $statList AS statName
				MERGE (a)-[:Specify]->(s:Statistic{name:statName})
				WITH e, s SET s.values=\"N/A\"
				RETURN e`,
			'mapper': 'props'
		},
		'getUser': {
			'query': 'MATCH (u:User{name:$userName, email:$userEmail}) RETURN u',
			'mapper': 'props'
		},
		'createUser': {
			'query': `CREATE (u:User{name:$userName, email:$userEmail, role:$userRole})
				RETURN u`,
			'mapper': 'props'
		},
		'createUserNodes': {
			'query': `CALL apoc.load.json("${scoutsJsonPath}") YIELD value
				UNWIND value.scouts AS scout
				MERGE(user:User {name: scout.name, email: scout.email})
				ON CREATE SET user = scout
				ON MATCH SET user = scout
				RETURN scout`,
			'mapper': 'props'
		},
		'createUserScoutRelationships': {
			'query': `MATCH (u:User)
				UNWIND u.matches AS mnum
				MATCH (q:Qual{q.matchNum:mnum})<-[:Schedules]-(e:Event{id:$eventId})
				WITH u, q
				MERGE (u)-[:Scouts {station: u.station, submitted: false}]->(q)
				RETURN u, q`,
			'mapper': 'userQual'
		},
		'getQualsForUser': {
			'query': `MATCH (u:User)-[r]->(q:Qual)<-[]-(e:Event{id:$eventId})
				WHERE u.email = $userEmail
				RETURN q, r`,
			'mapper': 'qualRel'
		},
		'addRobotPhoto': {
			'query': `MATCH (t:Team {num:$teamNum})
				CREATE (t)-[:Appears]->(p:RobotPhoto {view:$view, photoData:$photoData, time:$time})
				RETURN t`,
			'mapper': 'props'
		},
		'getRobotPhotos': {
			'query': `MATCH (t:Team {num:$teamNum})-[:Appears]->(p:RobotPhoto {view:$view})
				RETURN p`,
			'mapper': 'photos'
		}
	};
	let neoSession = neoDriver.session();
	let result = await neoSession.run(queries[queryName].query, queryParams);
	if (queries[queryName].mapper !== undefined)
		result = mappers[queries[queryName].mapper](result);
	neoSession.close();
	return result;
}
