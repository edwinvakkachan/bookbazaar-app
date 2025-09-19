const passport = require('../config/passport');

module.exports = [
  passport.initialize(),
  passport.session()
];
