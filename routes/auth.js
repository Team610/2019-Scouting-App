"use strict";
let router = require('express').Router();
let querier = require('../util/user-querier');

// var passportGoogle = require('../models/auth/googleauth');

// // Forward to google for login
// router.get('/googlelogin',
//     passportGoogle.authenticate('google', { scope: ['profile', 'openid', 'email'] })
// );

// router.get('/googlecallback',
//         passportGoogle.authenticate('google', {failureRedirect: '/login' }),
//             function(req, res) {
//                         // Successful authentication, redirect to home.
//                         res.json({
// 							user: 
// 						});
//             }
// 		);
		
router.post('/login', async function(req, res, next) {
	//TODO: authenticate the user properly!!!
	console.log(req.body);
	let user = req.body;
	let dbUser = await querier.getUser(user);
	console.log(JSON.stringify(dbUser));
	res.json(dbUser);
});

module.exports = router;