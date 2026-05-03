const fs = require('fs');

require('dotenv').config({
  quiet: true,
});

/**
 * Read a secret value — prefers a Docker/Kubernetes file secret over a plain env var.
 * @param {{ envVar: string, fileEnvVar: string, env: NodeJS.ProcessEnv, fileSystem: { existsSync: Function, readFileSync: Function } }} opts
 * @returns {string|undefined} The secret value, or `undefined` if neither source is set.
 */
const readSecret = ({ envVar, fileEnvVar, env, fileSystem }) => {
  const filePath = env[fileEnvVar];

  if (filePath && fileSystem.existsSync(filePath)) {
    return fileSystem.readFileSync(filePath, 'utf8').trim();
  }

  return env[envVar];
};

/**
 * Creates an environment-based configuration source.
 *
 * @param {{ env?: NodeJS.ProcessEnv, fileSystem?: { existsSync: Function, readFileSync: Function } }} [deps]
 * @returns {{ read: () => Record<string, any> }}
 */
const createEnvironmentConfigSource = ({ env = process.env, fileSystem = fs } = {}) => ({
  read: () => ({
    nodeEnv: env.NODE_ENV,
    port: env.SERVER_PORT,
    mongoUrl: readSecret({
      envVar: 'MONGO_URL',
      fileEnvVar: 'MONGO_URL_FILE',
      env,
      fileSystem,
    }),
    jwtSecret: readSecret({
      envVar: 'JWT_SECRET',
      fileEnvVar: 'JWT_SECRET_FILE',
      env,
      fileSystem,
    }),
    jwtLifetime: env.JWT_LIFETIME,
    corsOrigin: env.CORS_ORIGIN,
    trustProxyHops: env.TRUST_PROXY_HOPS,
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
    logLevel: env.LOG_LEVEL,
    requestSizeLimit: env.REQUEST_SIZE_LIMIT,
  }),
});

module.exports = {
  createEnvironmentConfigSource,
};
