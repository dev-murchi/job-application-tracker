require('dotenv').config({
  quiet: true,
});

const { ConfigSchema } = require('../schemas');
const { loadAndValidate } = require('../utils/config-validation');

const rawConfig = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.SERVER_PORT,
  mongoUrl: process.env.MONGO_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtLifetime: process.env.JWT_LIFETIME,
  corsOrigin: process.env.CORS_ORIGIN,
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
  logLevel: process.env.LOG_LEVEL,
  requestSizeLimit: process.env.REQUEST_SIZE_LIMIT,
};

const config = loadAndValidate(ConfigSchema, rawConfig);

module.exports = {
  nodeEnv: config.nodeEnv,
  port: config.port,
  mongoUrl: config.mongoUrl,
  jwtSecret: config.jwtSecret,
  jwtLifetime: config.jwtLifetime,
  corsOrigin: config.corsOrigin,
  rateLimitWindowMs: config.rateLimitWindowMs,
  rateLimitMaxRequests: config.rateLimitMaxRequests,
  logLevel: config.logLevel,
  requestSizeLimit: config.requestSizeLimit,
  isProduction: config.nodeEnv === 'production',
  isDevelopment: config.nodeEnv === 'development',
};
