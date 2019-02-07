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

exports.queryDB = async function (queryName, queryParams) {
    const queries = {
        'getTeam': {'query':'MATCH (t:Team) WHERE t.num=toInteger($teamNum) RETURN team'},
        'getFormsForTeam':{'query':'MATCH (t:Team) WHERE t.num=toInteger($teamNum) WITH t MATCH (t)-[:Plays{active:true}]->(f:Form) RETURN f'},
        'getFormMetricsForTeam':{'query':'MATCH (t:Team) WHERE t.num=toInteger($teamNum) WITH t MATCH (t)-[:Plays{active:true}]->(f:Form)-[:Do]->(m:Metric) WHERE f.eventId=$event RETURN m, f.matchNum', 'mapper':teamMetricMapper} //TODO: Figure out how to make this query work with replays
    };
    let neoSession = neoDriver.session();
    let result = await neoSession.run(queries[queryName]['query'], queryParams);
    if(queries[queryName]['mapper']!=undefined) {
        result = queries[queryName]['mapper'](result);
    }
    neoSession.close();
    return result;
}
