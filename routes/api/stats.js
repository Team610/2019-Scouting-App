"use strict";
const request = require('request');
let router = require('express').Router();
const dbUtils = require('../../neo4j/dbUtils');
const logger = require("../../util/logger"); //TODO: make this path more absolute
const aggStats = require("../../public/aggAnalytics.json");
const mbmStats = require("../../public/mbmAnalytics.json");
const statGroups = require("../../public/statGroups.json");

function groupMiddleware(req) {
    if(req.query.groups) {
        if(!req.query.stats) {
            req.query.stats = [];
        }
        for (let group of req.query.groups) {
            if (statGroups[group]) {
                for (let stat of statGroups[group]) {
                    if(!req.query.stats.includes(stat)) {
                        req.query.stats.push(stat);
                    }
                }
            }
        }
    }
    return req;
    //TODO: make this proper middleware
}

function teamMiddleware(req) {
    if(!req.query.teams) {
        req.query.teams = ["610"];
    }
    return req;
}

router.get('/team/:team_id/agg', function (req, res, next) {
    let teamid = req.params.team_id;//.toString(10);
    let finaljson = {};
    finaljson[teamid]={};
    req = groupMiddleware(req);
    if (req.query.stats) {
        for (let stat of req.query.stats) {
            finaljson[teamid][stat] = aggStats[teamid][stat];
        }
    } else {
        finaljson[teamid] = aggStats[teamid];
    }
    res.json(finaljson);
});

router.get('/team/:team_id/mbm', function (req, res, next) {
    let teamid = req.params.team_id;//.toString(10);
    let finaljson = {};
    finaljson[teamid]={};
    req = groupMiddleware(req);
    if(req.query.stats) {
        for (let stat of req.query.stats) {
            finaljson[teamid][stat] = mbmStats[teamid][stat];
        }
    } else {
        finaljson[teamid] = mbmStats[teamid];
    }
    res.json(finaljson);
});

router.get('/teams/agg', function (req, res, next) {
    let finaljson = {};
    req = groupMiddleware(req);
    req = teamMiddleware(req);
    for (let team of req.query.teams) {
        finaljson[team]={};
        if(req.query.stats) {
            for (let stat of req.query.stats) {
                finaljson[team][stat] = aggStats[team][stat];
            }
        } else {
            finaljson[team] = aggStats[team];
        }
    }
    res.json(finaljson);
});

router.get('/teams/mbm', function (req, res, next) {
    let finaljson = {};
    req = groupMiddleware(req);
    req = teamMiddleware(req);
    for (let team of req.query.teams) {
        finaljson[team]={};
        if(req.query.stats) {
            for (let stat of req.query.stats) {
                finaljson[team][stat] = mbmStats[team][stat];
            }
        } else {
            finaljson[team] = mbmStats[team];
        }
    }
    res.json(finaljson);
});

module.exports = router;
