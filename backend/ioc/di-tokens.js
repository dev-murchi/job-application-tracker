/**
 * DI tokens — the single source of truth for all port symbols.
 *
 * Every driving (in) and driven (out) port is identified by a unique Symbol
 * defined here. Symbols prevent token collisions and cannot be accidentally
 * recreated with the same string elsewhere.
 *
 * Usage:
 *   const { AUTH_SERVICE_PORT } = require('./di-tokens');
 *   container.bindContract(AUTH_SERVICE_PORT, authServiceContract);
 *   container.register(AUTH_SERVICE_PORT, createAuthService(...));
 *   container.resolve(AUTH_SERVICE_PORT);
 */

// ── Driving ports (in) ────────────────────────────────────────────────────
const AUTH_SERVICE_PORT = Symbol('AuthService');
const JOB_SERVICE_PORT = Symbol('JobService');
const USER_SERVICE_PORT = Symbol('UserService');
const HEALTH_SERVICE_PORT = Symbol('HealthService');

// ── Driven ports (out) ────────────────────────────────────────────────────
const USER_REPOSITORY_PORT = Symbol('UserRepository');
const JOB_REPOSITORY_PORT = Symbol('JobRepository');
const CRYPTO_SERVICE_PORT = Symbol('CryptoService');
const TOKEN_SERVICE_PORT = Symbol('TokenService');
const DB_CONNECTION_MANAGER_PORT = Symbol('DbConnectionManager');
const CONFIG_SERVICE_PORT = Symbol('ConfigPort');
const LOGGER_SERVICE_PORT = Symbol('LoggerService');

// ── Infrastructure / framework ────────────────────────────────────────────
const DB_CONNECTION = Symbol('DbConnection');

// ── Presentation layer ────────────────────────────────────────────────────
const AUTH_ROUTER = Symbol('AuthRouter');
const JOBS_ROUTER = Symbol('JobsRouter');
const USER_ROUTER = Symbol('UserRouter');
const HEALTH_ROUTER = Symbol('HealthRouter');
const AUTHENTICATION_MIDDLEWARE = Symbol('AuthenticationMiddleware');
const EXPRESS_APP = Symbol('ExpressApp');

module.exports = {
  AUTH_SERVICE_PORT,
  JOB_SERVICE_PORT,
  USER_SERVICE_PORT,
  HEALTH_SERVICE_PORT,
  USER_REPOSITORY_PORT,
  JOB_REPOSITORY_PORT,
  CRYPTO_SERVICE_PORT,
  TOKEN_SERVICE_PORT,
  DB_CONNECTION_MANAGER_PORT,
  CONFIG_SERVICE_PORT,
  LOGGER_SERVICE_PORT,
  DB_CONNECTION,
  // presentation
  AUTH_ROUTER,
  JOBS_ROUTER,
  USER_ROUTER,
  HEALTH_ROUTER,
  AUTHENTICATION_MIDDLEWARE,
  EXPRESS_APP,
};
