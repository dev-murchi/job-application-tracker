const config = require('../config');
const { ONE_DAY_MS } = require('../constants');

const attachCookie = ({ res, token }) => {
  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + ONE_DAY_MS),
    secure: config.isProduction,
    sameSite: config.isProduction ? 'strict' : 'lax',
    path: '/',
  });
};

module.exports = attachCookie;
