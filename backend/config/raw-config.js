const fs = require('fs');

require('dotenv').config({
  quiet: true,
});

// Helper to read Docker secrets
const readSecret = (envVar, fileEnvVar) => {
  const filePath = process.env[fileEnvVar];
  if (filePath && fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf8').trim();
  }
  return process.env[envVar];
};

const rawConfig = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.SERVER_PORT,
  mongoUrl: readSecret('MONGO_URL', 'MONGO_URL_FILE'),
  jwtSecret: readSecret('JWT_SECRET', 'JWT_SECRET_FILE'),
  jwtLifetime: process.env.JWT_LIFETIME,
  corsOrigin: process.env.CORS_ORIGIN,
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
  logLevel: process.env.LOG_LEVEL,
  requestSizeLimit: process.env.REQUEST_SIZE_LIMIT,
};

module.exports = { rawConfig };
