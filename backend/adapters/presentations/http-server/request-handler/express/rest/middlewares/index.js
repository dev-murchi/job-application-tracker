const { createAuthenticationMiddleware } = require('./auth');
const { createErrorHandler } = require('./error-handler');
const notFound = require('./not-found');
const { createRateLimiters } = require('./rate-limiter');
const { validateBody, validateHeaders, validateParams, validateQuery } = require('./validator');

module.exports = {
  createAuthenticationMiddleware,
  createErrorHandler,
  createRateLimiters,
  notFound,
  validateBody,
  validateHeaders,
  validateParams,
  validateQuery,
};
