var matchFormConfig = require('../config/matchFormConfig.json');
var request = require('request');
var router = require('express').Router();
var dbUtils = require('../neo4j/dbUtils');
// var writeResponse = require('../helpers/response').writeResponse;
const logger = require("../util/logger");

router.get('/', async function(req, res, next) {
	logger.debug("display analytics");
    var neoSession = dbUtils.getSession();

    try {
        var avgJSON = '[{}]';
        const result = await neoSession.run('MATCH (team:TeamAtEvent) WHERE team.event=$event RETURN team', {event: '2018onosh'});
        for(var i=0; i<result.records.length; i++) {
            var teamNum = result.records[i].get(0).properties.num;
            const avgRecs = await neoSession.run('MATCH (sprTeam:Team) WHERE sprTeam.num=$teamNum '+
                'MATCH (team:TeamAtEvent)--(sprTeam) WHERE team.event=$event '+
                'MATCH (stat:Statistic{name:$statName,type:$statType})<-[:Calculate]-(team) '+
                'RETURN stat.value',
                {
                    event: "2018onosh",
                    teamNum: teamNum,
                    statName: "a_auton_path",
                    statType: "avg"
                });
            avgJSON = avgJSON.substring(0,avgJSON.length-1)+',{"team":'+teamNum+',"val":'+avgRecs.records[0].get(0)+'}]';
        }
        avgJSON = JSON.parse(avgJSON);
        logger.debug(avgJSON);
    } catch (err) {
        logger.debug('Failed to display stats');
    }
    dbUtils.endTransaction(neoSession);

    res.render('dispAnalytics', {title:'Analytics', avgJSON:avgJSON});
});

module.exports = router;
