require('dotenv').config();
const { z } = require('zod');

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
}

// JWT Secret validation based on JWT BCP recommendations
const JwtSecretSchema = z.string()
  .min(32, 'JWT secret must be at least 32 characters (256 bits) for security')
  .refine((secret) => {
    // Check entropy - secret should not be predictable
    const entropy = calculateShannonEntropy(secret);
    return entropy >= 4.5; // Reasonable entropy threshold
  }, {
    message: 'JWT secret has insufficient entropy. Use a cryptographically secure random string'
  });

const ConfigSchema = z.object({
  // Application settings
  nodeEnv: z.enum(['development', 'production', 'test']),
  port: z.coerce.number().int().min(1).max(65535).default(3001),

  // MongoDB configuration
  mongoUrl: z.string().min(1, 'MongoDB URL is required'),

  // JWT configuration
  jwtSecret: JwtSecretSchema,
  jwtLifetime: z.string()
    .regex(/^\d+[dhms]$/, 'JWT lifetime must be in format: 30d, 24h, 60m, 3600s')
    .refine((lifetime) => {
      // Parse and validate reasonable lifetime limits
      const value = parseInt(lifetime);
      const unit = lifetime.slice(-1);

      if (unit === 'd') return value <= 30; // Max 30 days
      if (unit === 'h') return value <= 720; // Max 30 days in hours
      if (unit === 'm') return value <= 43200; // Max 30 days in minutes
      if (unit === 's') return value <= 2592000; // Max 30 days in seconds

      return false;
    }, {
      message: 'JWT lifetime cannot exceed 30 days for security reasons'
    })
    .default('7d'),

  // CORS Configuration
  corsOrigin: z.string().default('*'),

  // Rate Limiting
  rateLimitWindowMs: z.coerce.number().int().positive().default(900000), // 15 minutes
  rateLimitMaxRequests: z.coerce.number().int().positive().default(100),

  // Logging Configuration
  logLevel: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),

  // Request Size Limit
  requestSizeLimit: z.union([
    z.string().regex(/^\d+[kmgtpezy]?b?$/i, 'Invalid size format. Use formats like "10mb", "500kb", "1gb"'),
    z.coerce.number().int().positive()
  ]).default('100kb')
});

const loadAndValidate = (schema, rawConfig) => {
  try {
    return schema.parse(rawConfig);
  } catch (error) {
    console.error('Error occurred:', error);
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map(err => {
        let message = `${err.path.join('.')}: ${err.message}`;

        // Add helpful suggestion for JWT secret errors
        if (err.path.includes('jwtSecret')) {
          message += `\n\nTo generate a secure JWT secret, run:\n` +
            `node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"`;
        }

        return message;
      }).join('\n');

      console.error(`\nConfiguration validation failed:\n${errorMessages}\n`);
    }
    process.exit(1);
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
  logLevel: process.env.LOG_LEVEL,
  requestSizeLimit: process.env.REQUEST_SIZE_LIMIT
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