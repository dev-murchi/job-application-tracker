const { ONE_DAY_MS } = require('../constants');

/**
 * Attaches a token cookie to the response
 * @param {Object} params - Parameters object
 * @param {Object} params.res - Express response object
 * @param {string} params.token - JWT token to store in cookie
 * @param {boolean} [params.secure=true] - Whether to use secure cookie flag
 */
const attachCookie = ({ res, token, secure = true }) => {
  res.cookie('token', token, {
    httpOnly: true,
    expires: new Date(Date.now() + ONE_DAY_MS),
    secure: secure,
    sameSite: secure ? 'strict' : 'lax',
    path: '/',
  });
};

module.exports = attachCookie;
