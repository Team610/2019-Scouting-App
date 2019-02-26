var express = require('express');
var router = express.Router();

var passportGoogle = require('../models/auth/googleauth');

// Forward to google for login
router.get('/googlelogin',
    passportGoogle.authenticate('google', { scope: ['profile', 'openid', 'email'] })
);

router.get('/googlecallback',
        passportGoogle.authenticate('google', {failureRedirect: '/login' }),
            function(req, res) {
                        // Successful authentication, redirect to home.
                        res.redirect('/admin');
            }
    	);

module.exports = router;