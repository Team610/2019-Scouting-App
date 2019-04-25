"use strict";
const dbUtils = require('../neo4j/dbUtils');
const logger = require('./logger');
const analyticsConfig = require('../config/formConfig.json').db_analytics_agg;
const request = require('request-promise');

exports.createEvent = async (eventCode) => {
	logger.debug(`creating event ${eventCode}`);
	await dbUtils.queryDB('createEvent', { eventId: eventCode });
	let rawMatchList = await request({
		uri: `https://www.thebluealliance.com/api/v3/event/${eventCode}/matches/simple`,
		headers: {
			"X-TBA-Auth-Key": "WWbuyDx53ooxSxKsKG5rKb1j4vdzjNHbs7fjE8y3Utl3X7IogxeVkBile53EvdNx"
		},
		json: true
	});
	let matchesParams = { matchList: [] };
	let count = 0;
	for (let i = 0; i < rawMatchList.length; i++) {
		if (rawMatchList[i].comp_level != 'qm') {
			continue;
		}
		let matchNum = rawMatchList[i].match_number;
		let blue = rawMatchList[i].alliances.blue.team_keys;
		let red = rawMatchList[i].alliances.red.team_keys;
		for (let j = 0; j < 3; j++) {
			blue[j] = blue[j].substring(3);
			red[j] = red[j].substring(3);
		}
		matchesParams.matchList[count] = {
			num: matchNum,
			teams: [red[0], red[1], red[2], blue[0], blue[1], blue[2]]
		}
		count++;
	}
	matchesParams.eventId = eventCode;
	let matchRes = await dbUtils.queryDB('createEventMatches', matchesParams);
	logger.debug(`created matches for ${matchRes.id}`);

	let rawTeamList = await request({
		uri: `https://www.thebluealliance.com/api/v3/event/${eventCode}/teams/simple`,
		headers: {
			"X-TBA-Auth-Key": "WWbuyDx53ooxSxKsKG5rKb1j4vdzjNHbs7fjE8y3Utl3X7IogxeVkBile53EvdNx"
		},
		json: true
	});
	let teamsParams = { teamList: [] };
	for (let i = 0; i < rawTeamList.length; i++) {
		teamsParams.teamList[i] = rawTeamList[i].team_number;
	}
	teamsParams.eventId = eventCode;
	let teamRes = await dbUtils.queryDB('createEventTeams', teamsParams);
	logger.debug(`created teams for ${teamRes.id}`);

	let analyticsParams = teamsParams;
	analyticsParams.statList = [];
	for (let config of analyticsConfig) {
		analyticsParams.statList.push(config.name);
	}
	let analyticsRes = await dbUtils.queryDB('createEventTeamAnalytics', analyticsParams);
	logger.debug(`created team analytic nodes for ${analyticsRes.id}`);
}

const getTeams = exports.getTeams = async (event) => {
	if (event === undefined)
		event = await getCurEvent();
	let teams = await dbUtils.queryDB('getTeamList', { eventId: event });
	return teams;
}

const getCurEvent = exports.getCurEvent = async () => {
	try {
		const e = await dbUtils.queryDB('getCurEvent', {});
		return e;
	} catch (err) {
		return -1;
	}
}

exports.setCurEvent = async (event) => {
	try {
		const e = await dbUtils.queryDB('setCurEvent', { eventId: event });
		return e;
	} catch (err) {
		return -1;
	}
}

exports.validateEvent = async (event) => {
	if (event === undefined)
		event = await getCurEvent();

	//NOTE: this code should change from year to year based on what the game is like and what the score breakdown json looks like

	let discrepancies = [];

	const teams = await getTeams(event);
	let data = {};
	for (let team of teams) {
		let res = await dbUtils.queryDB('getFormMetricsForTeam', {
			teamNum: team,
			eventId: event
		});
		data[team] = {};
		for (let match of Object.keys(res)) {
			data[team][match] = {
				ship_preloads: res[match].ship_preloads,
				start_on_lvl_2: res[match].start_on_lvl_2,
				climb_lvl: res[match].climb_lvl
			};
		}
	}

	const matches = await request({
		uri: `https://www.thebluealliance.com/api/v3/event/${event}/matches`,
		headers: {
			"X-TBA-Auth-Key": "WWbuyDx53ooxSxKsKG5rKb1j4vdzjNHbs7fjE8y3Utl3X7IogxeVkBile53EvdNx"
		},
		json: true
	});
	for (let match of matches) {
		if (match.comp_level !== 'qm') {
			continue;
		}
		const mNum = match.match_number + '';
		const r_bd = match.score_breakdown.red;
		const b_bd = match.score_breakdown.blue;
		const r1_bd = {
			ship_preloads: [
				r_bd.preMatchBay3 === 'Cargo' ? 'cargo' : 'hatch',
				r_bd.preMatchBay6 === 'Cargo' ? 'cargo' : 'hatch'
			],
			start_on_lvl_2: [r_bd.preMatchLevelRobot1 === 'HabLevel2' ? 'true' : 'false'],
			climb_lvl: [r_bd.endgameRobot1 === 'None' ? '0' : r_bd.endgameRobot1.charAt(8)]
		}
		const r2_bd = {
			ship_preloads: [
				r_bd.preMatchBay2 === 'Cargo' ? 'cargo' : 'hatch',
				r_bd.preMatchBay7 === 'Cargo' ? 'cargo' : 'hatch'
			],
			start_on_lvl_2: [r_bd.preMatchLevelRobot2 === 'HabLevel2' ? 'true' : 'false'],
			climb_lvl: [r_bd.endgameRobot2 === 'None' ? '0' : r_bd.endgameRobot2.charAt(8)]
		}
		const r3_bd = {
			ship_preloads: [
				r_bd.preMatchBay1 === 'Cargo' ? 'cargo' : 'hatch',
				r_bd.preMatchBay8 === 'Cargo' ? 'cargo' : 'hatch'
			],
			start_on_lvl_2: [r_bd.preMatchLevelRobot3 === 'HabLevel2' ? 'true' : 'false'],
			climb_lvl: [r_bd.endgameRobot3 === 'None' ? '0' : r_bd.endgameRobot3.charAt(8)]
		}
		const b1_bd = {
			ship_preloads: [
				b_bd.preMatchBay3 === 'Cargo' ? 'cargo' : 'hatch',
				b_bd.preMatchBay6 === 'Cargo' ? 'cargo' : 'hatch'
			],
			start_on_lvl_2: [b_bd.preMatchLevelRobot1 === 'HabLevel2' ? 'true' : 'false'],
			climb_lvl: [b_bd.endgameRobot1 === 'None' ? '0' : b_bd.endgameRobot1.charAt(8)]
		}
		const b2_bd = {
			ship_preloads: [
				b_bd.preMatchBay2 === 'Cargo' ? 'cargo' : 'hatch',
				b_bd.preMatchBay7 === 'Cargo' ? 'cargo' : 'hatch'
			],
			start_on_lvl_2: [b_bd.preMatchLevelRobot2 === 'HabLevel2' ? 'true' : 'false'],
			climb_lvl: [b_bd.endgameRobot2 === 'None' ? '0' : b_bd.endgameRobot2.charAt(8)]
		}
		const b3_bd = {
			ship_preloads: [
				b_bd.preMatchBay1 === 'Cargo' ? 'cargo' : 'hatch',
				b_bd.preMatchBay8 === 'Cargo' ? 'cargo' : 'hatch'
			],
			start_on_lvl_2: [b_bd.preMatchLevelRobot3 === 'HabLevel2' ? 'true' : 'false'],
			climb_lvl: [b_bd.endgameRobot3 === 'None' ? '0' : b_bd.endgameRobot3.charAt(8)]
		}
		const r_a = match.alliances.red.team_keys;
		const b_a = match.alliances.blue.team_keys;
		const r1 = r_a[0].substring(3);
		const r2 = r_a[1].substring(3);
		const r3 = r_a[2].substring(3);
		const b1 = b_a[0].substring(3);
		const b2 = b_a[1].substring(3);
		const b3 = b_a[2].substring(3);
		console.log(data[b2]);
		console.log(mNum);

		if (data[r1][mNum]) {
			let d_sp0 = data[r1][mNum].ship_preloads[0];
			let d_sp1 = data[r1][mNum].ship_preloads[1];
			let b_sp0 = r1_bd.ship_preloads[0];
			let b_sp1 = r1_bd.ship_preloads[1];
			const matching = d_sp0 === b_sp0 && d_sp1 === b_sp1;
			const alternating = d_sp0 === b_sp1 && d_sp1 === b_sp0;
			if (matching || alternating) {
				discrepancies.push({ team: r1, matchNum: mNum, field: "ship_preloads" });
			}
			if (data[r1][mNum].start_on_lvl_2[0] !== r1_bd.start_on_lvl_2[0]) {
				discrepancies.push({ team: r1, matchNum: mNum, field: "start_on_lvl_2" });
			}
			if (data[r1][mNum].climb_lvl[0] !== r1_bd.climb_lvl[0]) {
				discrepancies.push({ team: r1, matchNum: mNum, field: "climb_lvl" });
			}
		}

		if (data[r2][mNum]) {
			let d_sp0 = data[r2][mNum].ship_preloads[0];
			let d_sp1 = data[r2][mNum].ship_preloads[1];
			let b_sp0 = r2_bd.ship_preloads[0];
			let b_sp1 = r2_bd.ship_preloads[1];
			const matching = d_sp0 === b_sp0 && d_sp1 === b_sp1;
			const alternating = d_sp0 === b_sp1 && d_sp1 === b_sp0;
			if (matching || alternating) {
				discrepancies.push({ team: r2, matchNum: mNum, field: "ship_preloads" });
			}
			if (data[r2][mNum].start_on_lvl_2[0] !== r2_bd.start_on_lvl_2[0]) {
				discrepancies.push({ team: r2, matchNum: mNum, field: "start_on_lvl_2" });
			}
			if (data[r2][mNum].climb_lvl[0] !== r2_bd.climb_lvl[0]) {
				discrepancies.push({ team: r2, matchNum: mNum, field: "climb_lvl" });
			}
		}

		if (data[r3][mNum]) {
			let d_sp0 = data[r3][mNum].ship_preloads[0];
			let d_sp1 = data[r3][mNum].ship_preloads[1];
			let b_sp0 = r3_bd.ship_preloads[0];
			let b_sp1 = r3_bd.ship_preloads[1];
			const matching = d_sp0 === b_sp0 && d_sp1 === b_sp1;
			const alternating = d_sp0 === b_sp1 && d_sp1 === b_sp0;
			if (matching || alternating) {
				discrepancies.push({ team: r3, matchNum: mNum, field: "ship_preloads" });
			}
			if (data[r3][mNum].start_on_lvl_2[0] !== r3_bd.start_on_lvl_2[0]) {
				discrepancies.push({ team: r3, matchNum: mNum, field: "start_on_lvl_2" });
			}
			if (data[r3][mNum].climb_lvl[0] !== r3_bd.climb_lvl[0]) {
				discrepancies.push({ team: r3, matchNum: mNum, field: "climb_lvl" });
			}
		}

		if (data[b1][mNum]) {
			let d_sp0 = data[b1][mNum].ship_preloads[0];
			let d_sp1 = data[b1][mNum].ship_preloads[1];
			let b_sp0 = b1_bd.ship_preloads[0];
			let b_sp1 = b1_bd.ship_preloads[1];
			const matching = d_sp0 === b_sp0 && d_sp1 === b_sp1;
			const alternating = d_sp0 === b_sp1 && d_sp1 === b_sp0;
			if (matching || alternating) {
				discrepancies.push({ team: b1, matchNum: mNum, field: "ship_preloads" });
			}
			if (data[b1][mNum].start_on_lvl_2[0] !== b1_bd.start_on_lvl_2[0]) {
				discrepancies.push({ team: b1, matchNum: mNum, field: "start_on_lvl_2" });
			}
			if (data[b1][mNum].climb_lvl[0] !== b1_bd.climb_lvl[0]) {
				discrepancies.push({ team: b1, matchNum: mNum, field: "climb_lvl" });
			}
		}

		if (data[b2][mNum]) {
			let d_sp0 = data[b2][mNum].ship_preloads[0];
			let d_sp1 = data[b2][mNum].ship_preloads[1];
			let b_sp0 = b2_bd.ship_preloads[0];
			let b_sp1 = b2_bd.ship_preloads[1];
			const matching = d_sp0 === b_sp0 && d_sp1 === b_sp1;
			const alternating = d_sp0 === b_sp1 && d_sp1 === b_sp0;
			if (matching || alternating) {
				discrepancies.push({ team: b2, matchNum: mNum, field: "ship_preloads" });
			}
			if (data[b2][mNum].start_on_lvl_2[0] !== b2_bd.start_on_lvl_2[0]) {
				discrepancies.push({ team: b2, matchNum: mNum, field: "start_on_lvl_2" });
			}
			if (data[b2][mNum].climb_lvl[0] !== b2_bd.climb_lvl[0]) {
				discrepancies.push({ team: b2, matchNum: mNum, field: "climb_lvl" });
			}
		}

		if (data[b3][mNum]) {
			let d_sp0 = data[b3][mNum].ship_preloads[0];
			let d_sp1 = data[b3][mNum].ship_preloads[1];
			let b_sp0 = b3_bd.ship_preloads[0];
			let b_sp1 = b3_bd.ship_preloads[1];
			const matching = d_sp0 === b_sp0 && d_sp1 === b_sp1;
			const alternating = d_sp0 === b_sp1 && d_sp1 === b_sp0;
			if (matching || alternating) {
				discrepancies.push({ team: b3, matchNum: mNum, field: "ship_preloads" });
			}
			if (data[b3][mNum].start_on_lvl_2[0] !== b3_bd.start_on_lvl_2[0]) {
				discrepancies.push({ team: b3, matchNum: mNum, field: "start_on_lvl_2" });
			}
			if (data[b3][mNum].climb_lvl[0] !== b3_bd.climb_lvl[0]) {
				discrepancies.push({ team: b3, matchNum: mNum, field: "climb_lvl" });
			}
		}
	}
	if (discrepancies[0] === undefined) {
		return false;
	} else {
		return discrepancies;
	}
}
