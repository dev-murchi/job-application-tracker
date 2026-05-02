/**
 * Application DI registry — the composition root.
 *
 * This module owns all dependency wiring decisions:
 *   1. Database layer  (connection adapter -> connection manager -> db-service -> models)
 *   2. Service layer   (jwt, auth, job, user, health)
 *   3. Controller layer
 *   4. Router layer
 *   5. Middleware
 *   6. Express app
 *
 * The generic container (ioc/container.js) has zero application knowledge;
 * all wiring lives here.
 *
 * Ports-and-adapters enforcement:
 *   Each port token (Symbol) is paired with a contract. The container validates
 *   every adapter at registration time via bindContract(token, contract).
 */

const {
  createMongoConnectionManager,
} = require('../adapters/infrastructure/database/mongodb/mongo-connection-manager');
const {
  createMongoUserRepository,
} = require('../adapters/infrastructure/database/mongodb/repositories/mongo-user.repository');

// Services
const {
  createAuthService,
  createJobService,
  createUserService,
  createHealthService,
} = require('../application/services');

const {
  createBcryptCryptoService,
} = require('../adapters/infrastructure/crypto/bcrypt-crypto.service');
const { createJwtService } = require('../adapters/infrastructure/security/jwt.service');

// Middleware
const {
  createAuthenticationMiddleware,
} = require('../adapters/presentations/http-server/request-handler/express/rest/middlewares/auth');

// Routes
const {
  createAuthRouter,
} = require('../adapters/presentations/http-server/request-handler/express/rest/routers/auth');
const {
  createJobsRouter,
} = require('../adapters/presentations/http-server/request-handler/express/rest/routers/jobs');
const {
  createUserRouter,
} = require('../adapters/presentations/http-server/request-handler/express/rest/routers/user');
const {
  createHealthRouter,
} = require('../adapters/presentations/http-server/request-handler/express/rest/routers/health');

// App
const { createApp } = require('../adapters/presentations/http-server/request-handler/express/app');
const { createContainerInstance } = require('./container');
const {
  createMongoJobsRepository,
} = require('../adapters/infrastructure/database/mongodb/repositories/mongo-jobs.repository');

// DI tokens
const {
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
  LOGGER_SERVICE,
  DB_CONNECTION,
  AUTH_ROUTER,
  JOBS_ROUTER,
  USER_ROUTER,
  HEALTH_ROUTER,
  AUTHENTICATION_MIDDLEWARE,
  EXPRESS_APP,
} = require('./di-tokens');

// Port contracts
const { authServiceContract } = require('../application/ports/driving/auth.service.port');
const { jobServiceContract } = require('../application/ports/driving/job.service.port');
const { userServiceContract } = require('../application/ports/driving/user.service.port');
const { healthServiceContract } = require('../application/ports/driving/health.service.port');
const {
  userRepositoryContract,
} = require('../application/ports/driven/database/user.repository.port');
const {
  jobRepositoryContract,
} = require('../application/ports/driven/database/job.repository.port');
const { cryptoServiceContract } = require('../application/ports/driven/crypto/crypto.service.port');
const { tokenServiceContract } = require('../application/ports/driven/security/token.service.port');
const {
  dbConnectionManagerContract,
} = require('../application/ports/driven/database/db-connection-manager.port');
const { configServiceContract } = require('../application/ports/driven/config/config-service.port');

/**
 * Build and wire the full application container.
 *
 * @param {{ configService: object, loggerService: object }} deps
 * @returns {Promise<object>} Fully wired container
 */
const createContainerRegistry = ({ configService, loggerService }) => {
  const container = createContainerInstance();

  // ── Declare all port contracts up front ───────────────────────────────────
  container.bindContract(USER_REPOSITORY_PORT, userRepositoryContract);
  container.bindContract(JOB_REPOSITORY_PORT, jobRepositoryContract);
  container.bindContract(CRYPTO_SERVICE_PORT, cryptoServiceContract);
  container.bindContract(TOKEN_SERVICE_PORT, tokenServiceContract);
  container.bindContract(AUTH_SERVICE_PORT, authServiceContract);
  container.bindContract(JOB_SERVICE_PORT, jobServiceContract);
  container.bindContract(USER_SERVICE_PORT, userServiceContract);
  container.bindContract(HEALTH_SERVICE_PORT, healthServiceContract);
  container.bindContract(DB_CONNECTION_MANAGER_PORT, dbConnectionManagerContract);
  container.bindContract(CONFIG_SERVICE_PORT, configServiceContract);

  // Register core services
  container.register(CONFIG_SERVICE_PORT, configService);
  container.register(LOGGER_SERVICE, loggerService);

  // ============================================
  // DATABASE LAYER
  // ============================================

  const dbConnectionManager = createMongoConnectionManager({
    configService,
    loggerService,
  });

  container.register(DB_CONNECTION_MANAGER_PORT, dbConnectionManager, () =>
    dbConnectionManager.close(),
  );

  const mongooseConnection = dbConnectionManager.getDriverInstance();
  container.register(DB_CONNECTION, mongooseConnection);

  const userRepository = createMongoUserRepository({
    configService,
    connection: dbConnectionManager.getDriverInstance(),
  });

  container.register(USER_REPOSITORY_PORT, userRepository);

  const jobRepository = createMongoJobsRepository({
    configService,
    connection: dbConnectionManager.getDriverInstance(),
  });

  container.register(JOB_REPOSITORY_PORT, jobRepository);

  const cryptoService = createBcryptCryptoService();
  container.register(CRYPTO_SERVICE_PORT, cryptoService);

  // JWT
  const jwtService = createJwtService({ configService });
  container.register(TOKEN_SERVICE_PORT, jwtService);

  // ============================================
  // BUSINESS LAYER (Services)
  // ============================================
  container.register(
    AUTH_SERVICE_PORT,
    createAuthService({ userRepository, jwtService, cryptoService }),
  );
  container.register(JOB_SERVICE_PORT, createJobService({ jobRepository }));
  container.register(USER_SERVICE_PORT, createUserService({ userRepository }));
  container.register(
    HEALTH_SERVICE_PORT,
    createHealthService({
      dbConnectionManager: container.resolve(DB_CONNECTION_MANAGER_PORT),
      configService,
    }),
  );

  // ============================================
  // ROUTING LAYER
  // ============================================
  container.register(
    AUTH_ROUTER,
    createAuthRouter({
      authService: container.resolve(AUTH_SERVICE_PORT),
      configService,
    }),
  );
  container.register(
    JOBS_ROUTER,
    createJobsRouter({ jobService: container.resolve(JOB_SERVICE_PORT) }),
  );
  container.register(
    USER_ROUTER,
    createUserRouter({ userService: container.resolve(USER_SERVICE_PORT) }),
  );
  container.register(
    HEALTH_ROUTER,
    createHealthRouter({ healthService: container.resolve(HEALTH_SERVICE_PORT) }),
  );

  // ============================================
  // MIDDLEWARE
  // ============================================
  container.register(
    AUTHENTICATION_MIDDLEWARE,
    createAuthenticationMiddleware({ userRepository, loggerService, jwtService }),
  );

  // ============================================
  // EXPRESS APPLICATION
  // ============================================

  const app = createApp({
    routes: [
      { path: '/health', router: container.resolve(HEALTH_ROUTER) },
      { path: '/api/v1/auth', router: container.resolve(AUTH_ROUTER) },
      {
        path: '/api/v1/users',
        router: container.resolve(USER_ROUTER),
        middleware: [container.resolve(AUTHENTICATION_MIDDLEWARE).authenticateUser],
      },
      {
        path: '/api/v1/jobs',
        router: container.resolve(JOBS_ROUTER),
        middleware: [container.resolve(AUTHENTICATION_MIDDLEWARE).authenticateUser],
      },
    ],
    loggerService,
    configService,
  });
  container.register(EXPRESS_APP, app);

  return container;
};

module.exports = { createContainerRegistry };
