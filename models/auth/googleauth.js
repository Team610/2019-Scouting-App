let passport = require('passport');
let GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
let config = require('../../config/config.json');

passport.use(new GoogleStrategy(config.googleOAuth,
    function(accessToken, refreshToken, profile, done) {
        console.log('AccessToken token"' + accessToken);
        console.log('Refresh token"' + refreshToken);
        console.log('Refresh profile"' + profile);
        // Below is a hard coded example
        // It should be changed to retrieving user entry from local DB (or creating the entry if not existing yet)
        // Below is an example of using Moogle to authenticate the user
        // User.findOne({ username: username }, function (err, user) {
        //     if (err) { return done(err); }
        //     if (!user) {
        //         return done(null, false, { message: 'Incorrect username.' });
        //     }
        //     if (!user.validPassword(password)) {
        //         return done(null, false, { message: 'Incorrect password.' });
        //     }
        //     return done(null, user);
        // });
        if (profile['emails'][0].value == 'felixyu@crescentschool.org') {
            console.log('Login success')
            // passes the user found into a serializeUser, such as a cookie
            // the user could be the profile returned, or couild be from a user record retrieved from local DB matching the profile
            return done(null, profile)
        }
        else {
            console.log("Not authorized");
            return done(null, null)
        }
     })
);

// Used to stuff a piece of information into a cookie
passport.serializeUser((user, done) => {
    done(null, user);
});

// Used to decode the received cookie and persist session
passport.deserializeUser((user, done) => {
    done(null, user);
});

module.exports = passport;
