const config = require('../config');
const rateLimit = require('express-rate-limit');

const appLevelRateLimit = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const authRouteRateLimit = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: 5,
  message: 'Too many login/register attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  appLevelRateLimit,
  authRouteRateLimit,
};
