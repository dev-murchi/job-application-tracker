require('dotenv').config();
const { z } = require('zod');

const ConfigSchema = z.object({
  // Application settings
  nodeEnv: z.enum(['development', 'production', 'test']),
  port: z.coerce.number().int().min(1).max(65535).default(3001),

  // MongoDB configuration
  mongoUrl: z.string().min(1, 'MongoDB URL is required'),

  // JWT Configuration
  jwtSecret: z.string().min(12, 'JWT secret must be at least 12 characters long'),
  jwtLifetime: z.string().default('30d'),

  // CORS Configuration
  corsOrigin: z.string().default('*'),

  // Rate Limiting
  rateLimitWindowMs: z.coerce.number().int().positive().default(900000), // 15 minutes
  rateLimitMaxRequests: z.coerce.number().int().positive().default(100),

  // Logging Configuration
  logLevel: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
});

const loadAndValidate = (schema, rawConfig) => {
  try {
    return schema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');

      throw new Error(`Configuration validation failed:\n${errorMessages}`);
    }
    throw error;
  }
}

const rawConfig = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  mongoUrl: process.env.MONGO_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtLifetime: process.env.JWT_LIFETIME,
  corsOrigin: process.env.CORS_ORIGIN,
  rateLimitWindowMs: process.env.RATE_LIMIT_WINDOW_MS,
  rateLimitMaxRequests: process.env.RATE_LIMIT_MAX_REQUESTS,
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
};

