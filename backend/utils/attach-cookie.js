const config = require('../config');

const ONE_SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const MINUTES_IN_HOUR = 60;
const HOURS_IN_DAY = 24;

const ONE_MINUTE = SECONDS_IN_MINUTE * ONE_SECOND;
const ONE_HOUR = MINUTES_IN_HOUR * ONE_MINUTE;
const ONE_DAY = HOURS_IN_DAY * ONE_HOUR;

const attachCookie = ({ res, token }) => {
  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + ONE_DAY),
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    path: '/',
  });
};

module.exports = attachCookie;
