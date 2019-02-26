function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/login')
}

module.exports = ensureAuthenticated;


// Middleware to check if the user is authenticated
// function isUserAuthenticated(req, res, next) {
//     if (req.user) {
//         return next();
//     } else {
//         res.redirect('/login');
//     }
// }