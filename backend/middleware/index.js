const authenticateUser = require('./auth');
const errorHandler = require('./error-handler');
const notFound = require('./not-found');
const { appLevelRateLimit, authRouteRateLimit } = require('./rate-limiter');
const { validateBody, validateHeaders, validateParams, validateQuery } = require('./validator');

module.exports = {
  authenticateUser,
  errorHandler,
  notFound,
  appLevelRateLimit,
  authRouteRateLimit,
  validateBody,
  validateHeaders,
  validateParams,
  validateQuery,
};
