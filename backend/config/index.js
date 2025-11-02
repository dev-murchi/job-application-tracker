require('dotenv').config({
  quiet: true,
});
const { z } = require('zod');

// Constants for magic numbers
const JWT_SECRET_MIN_LENGTH = 32; // 256 bits
const JWT_SECRET_MIN_ENTROPY = 4.5;
const JWT_LIFETIME_MAX_DAYS = 30;
const JWT_LIFETIME_MAX_HOURS = 720; // 30 days * 24
const JWT_LIFETIME_MAX_MINUTES = 43200; // 30 days * 24 * 60
const JWT_LIFETIME_MAX_SECONDS = 2592000; // 30 days * 24 * 60 * 60
const DEFAULT_PORT = 3001;
const DEFAULT_JWT_LIFETIME = '7d';
const DEFAULT_CORS_ORIGIN = '*';
const DEFAULT_RATE_LIMIT_WINDOW_MS = 900000; // 15 minutes
const DEFAULT_RATE_LIMIT_MAX_REQUESTS = 100;
const DEFAULT_LOG_LEVEL = 'info';
const DEFAULT_REQUEST_SIZE_LIMIT = '100kb';
const PORT_MIN = 1;
const PORT_MAX = 65535;

// Regex patterns and error messages as constants
const JWT_LIFETIME_REGEX = /^\d+[dhms]$/;
const JWT_LIFETIME_REGEX_ERROR = 'JWT lifetime must be in format: 30d, 24h, 60m, 3600s';
const REQUEST_SIZE_LIMIT_REGEX = /^\d+[kmgtpezy]?b?$/i;
const REQUEST_SIZE_LIMIT_REGEX_ERROR =
  'Invalid size format. Use formats like "10mb", "500kb", "1gb"';

const calculateShannonEntropy = (str) => {
  const len = str.length;
  const frequencies = {};

  // Count character frequencies
  for (let i = 0; i < len; i++) {
    const char = str[i];
    frequencies[char] = (frequencies[char] || 0) + 1;
  }

  // Calculate Shannon entropy
  let entropy = 0;
  for (const char in frequencies) {
    const probability = frequencies[char] / len;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
};

// JWT Secret validation based on JWT BCP recommendations
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

const ConfigSchema = z.object({
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
  rateLimitMaxRequests: z.coerce.number().int().positive().default(DEFAULT_RATE_LIMIT_MAX_REQUESTS),

  // Logging Configuration
  logLevel: z.enum(['error', 'warn', 'info', 'http', 'debug']).default(DEFAULT_LOG_LEVEL),

  // Request Size Limit
  requestSizeLimit: z
    .union([
      z.string().regex(REQUEST_SIZE_LIMIT_REGEX, REQUEST_SIZE_LIMIT_REGEX_ERROR),
      z.coerce.number().int().positive(),
    ])
    .default(DEFAULT_REQUEST_SIZE_LIMIT),
});

const loadAndValidate = (schema, rawConfig) => {
  try {
    return schema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues
        .map((err) => {
          let message = `${err.path.join('.')}: ${err.message}`;

          // Add helpful suggestion for JWT secret errors
          if (err.path.includes('jwtSecret')) {
            message +=
              '\n\nTo generate a secure JWT secret, run:\n' +
              "node -e \"console.log(require('crypto').randomBytes(64).toString('base64'))\"";
          }

          return message;
        })
        .join('\n');

      console.error(`\nConfiguration validation failed:\n${errorMessages}\n`);
    }
    process.exit(1);
  }
};

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
