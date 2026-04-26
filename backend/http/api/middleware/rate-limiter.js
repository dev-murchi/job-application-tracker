const rateLimit = require('express-rate-limit');

/**
 * Create rate limiter middleware factory
 * @param {Object} options - Options object
 * @param {Object} options.configService - Configuration service
 * @returns {Object} Rate limiter middleware instances
 */
const createRateLimiters = ({ configService }) => {
  const windowMs = configService.get('rateLimitWindowMs');
  const maxRequests = configService.get('rateLimitMaxRequests');

  const appLevelRateLimit = rateLimit({
    windowMs,
    max: maxRequests,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req, _res) => req.method === 'GET' && req.path === '/health',
  });

  const authRouteRateLimit = rateLimit({
    windowMs,
    max: 5,
    message: 'Too many login/register attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
  });

  return {
    appLevelRateLimit,
    authRouteRateLimit,
  };
};

module.exports = {
  createRateLimiters,
};
