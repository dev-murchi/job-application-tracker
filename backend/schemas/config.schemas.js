const { z } = require('zod');
const {
  JWT_SECRET_MIN_LENGTH,
  JWT_SECRET_MIN_ENTROPY,
  JWT_LIFETIME_MAX_DAYS,
  JWT_LIFETIME_MAX_HOURS,
  JWT_LIFETIME_MAX_MINUTES,
  JWT_LIFETIME_MAX_SECONDS,
  DEFAULT_JWT_LIFETIME,
  DEFAULT_CORS_ORIGIN,
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  DEFAULT_RATE_LIMIT_MAX_REQUESTS,
  DEFAULT_LOG_LEVEL,
  DEFAULT_REQUEST_SIZE_LIMIT,
  PORT_MIN,
  PORT_MAX,
  JWT_LIFETIME_REGEX,
  JWT_LIFETIME_REGEX_ERROR,
  REQUEST_SIZE_LIMIT_REGEX,
  REQUEST_SIZE_LIMIT_REGEX_ERROR,
} = require('../constants');

const { calculateShannonEntropy } = require('../utils/config-validation');

/**
 * JWT Secret validation based on JWT BCP recommendations
 * Ensures minimum length and sufficient entropy for security
 */
const JwtSecretSchema = z
  .string()
  .min(
    JWT_SECRET_MIN_LENGTH,
    `JWT secret must be at least ${JWT_SECRET_MIN_LENGTH} characters (256 bits) for security`,
  )
  .refine(
    (secret) => {
      // Check entropy - secret should not be predictable
      const entropy = calculateShannonEntropy(secret);
      return entropy >= JWT_SECRET_MIN_ENTROPY; // Reasonable entropy threshold
    },
    {
      message: 'JWT secret has insufficient entropy. Use a cryptographically secure random string',
    },
  );

/**
 * Configuration schema with validation rules
 * Validates all environment variables and provides sensible defaults
 */
const ConfigSchema = z
  .object({
    // Application settings
    nodeEnv: z.enum(['development', 'production', 'test']),
    port: z.coerce.number().int().min(PORT_MIN).max(PORT_MAX),

    // MongoDB configuration
    mongoUrl: z.string().min(1, 'MongoDB URL is required'),

    // JWT configuration
    jwtSecret: JwtSecretSchema,
    jwtLifetime: z
      .string()
      .regex(JWT_LIFETIME_REGEX, JWT_LIFETIME_REGEX_ERROR)
      .refine(
        (lifetime) => {
          // Parse and validate reasonable lifetime limits
          const value = parseInt(lifetime);
          const unit = lifetime.slice(-1);

          if (unit === 'd') {
            return value <= JWT_LIFETIME_MAX_DAYS;
          }
          if (unit === 'h') {
            return value <= JWT_LIFETIME_MAX_HOURS;
          }
          if (unit === 'm') {
            return value <= JWT_LIFETIME_MAX_MINUTES;
          }
          if (unit === 's') {
            return value <= JWT_LIFETIME_MAX_SECONDS;
          }

          return false;
        },
        {
          message: `JWT lifetime cannot exceed ${JWT_LIFETIME_MAX_DAYS} days for security reasons`,
        },
      )
      .default(DEFAULT_JWT_LIFETIME),

    // CORS Configuration
    corsOrigin: z.string().default(DEFAULT_CORS_ORIGIN),

    // Rate Limiting
    rateLimitWindowMs: z.coerce.number().int().positive().default(DEFAULT_RATE_LIMIT_WINDOW_MS),
    rateLimitMaxRequests: z.coerce
      .number()
      .int()
      .positive()
      .default(DEFAULT_RATE_LIMIT_MAX_REQUESTS),

    // Logging Configuration
    logLevel: z.enum(['error', 'warn', 'info', 'http', 'debug']).default(DEFAULT_LOG_LEVEL),

    // Request Size Limit
    requestSizeLimit: z
      .union([
        z.string().regex(REQUEST_SIZE_LIMIT_REGEX, REQUEST_SIZE_LIMIT_REGEX_ERROR),
        z.coerce.number().int().positive(),
      ])
      .default(DEFAULT_REQUEST_SIZE_LIMIT),
  })
  .transform((cfg) => ({
    ...cfg,
    isProduction: cfg.nodeEnv === 'production',
    isDevelopment: cfg.nodeEnv === 'development',
    isTest: cfg.nodeEnv === 'test',
  }));

module.exports = {
  ConfigSchema,
  JwtSecretSchema,
};
