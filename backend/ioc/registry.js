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
 */

const { createMongoConnectionManager } = require('../database/mongodb/mongo-connection-manager');
const {
  createMongoUserRepository,
} = require('../database/mongodb/repositories/mongo-user.repository');

// Services
const {
  createAuthService,
  createJobService,
  createUserService,
  createHealthService,
} = require('../services');

const { createBcryptCryptoService } = require('../crypto/bcrypt-crypto.service');
const { createJwtService } = require('../security/jwt.service');

// Middleware
const {
  createAuthenticationMiddleware,
} = require('../http-server/request-handler/express/rest/middlewares/auth');

// Routes
const { createAuthRouter } = require('../http-server/request-handler/express/rest/routers/auth');
const { createJobsRouter } = require('../http-server/request-handler/express/rest/routers/jobs');
const { createUserRouter } = require('../http-server/request-handler/express/rest/routers/user');
const {
  createHealthRouter,
} = require('../http-server/request-handler/express/rest/routers/health');

// App
const { createApp } = require('../http-server/request-handler/express/app');
const { createContainerInstance } = require('./container');
const {
  createMongoJobsRepository,
} = require('../database/mongodb/repositories/mongo-jobs.repository');

/**
 * Build and wire the full application container.
 *
 * @param {{ configService: object, loggerService: object }} deps
 * @returns {Promise<object>} Fully wired container
 */
const createContainerRegistry = ({ configService, loggerService }) => {
  const container = createContainerInstance();

  // Register core services
  container.register('configService', configService);
  container.register('loggerService', loggerService);

  // ============================================
  // DATABASE LAYER
  // ============================================

  const dbConnectionManager = createMongoConnectionManager({
    configService,
    loggerService,
  });

  container.register('dbConnectionManager', dbConnectionManager, () => dbConnectionManager.close());

  const mongooseConnection = dbConnectionManager.getDriverInstance();
  container.register('connection', mongooseConnection);

  const userRepository = createMongoUserRepository({
    configService: container.resolve('configService'),
    connection: dbConnectionManager.getDriverInstance(),
  });

  container.register('userRepository', userRepository);

  const jobRepository = createMongoJobsRepository({
    configService: container.resolve('configService'),
    connection: dbConnectionManager.getDriverInstance(),
  });

  container.register('jobRepository', jobRepository);

  const cryptoService = createBcryptCryptoService();
  container.register('cryptoService', cryptoService);

  // JWT
  const jwtService = createJwtService({ configService: container.resolve('configService') });
  container.register('jwtService', jwtService);

  // ============================================
  // BUSINESS LAYER (Services)
  // ============================================
  container.register(
    'authService',
    createAuthService({ userRepository, jwtService, cryptoService }),
  );
  container.register('jobService', createJobService({ jobRepository }));
  container.register('userService', createUserService({ userRepository }));
  container.register('healthService', createHealthService({ dbConnectionManager, configService }));

  // ============================================
  // ROUTING LAYER
  // ============================================
  container.register(
    'authRouter',
    createAuthRouter({
      authService: container.resolve('authService'),
      configService: container.resolve('configService'),
    }),
  );
  container.register(
    'jobsRouter',
    createJobsRouter({ jobService: container.resolve('jobService') }),
  );
  container.register(
    'userRouter',
    createUserRouter({ userService: container.resolve('userService') }),
  );
  container.register(
    'healthRouter',
    createHealthRouter({ healthService: container.resolve('healthService') }),
  );

  // ============================================
  // MIDDLEWARE
  // ============================================
  container.register(
    'authenticationMiddleware',
    createAuthenticationMiddleware({ userRepository, loggerService, jwtService }),
  );

  // ============================================
  // EXPRESS APPLICATION
  // ============================================

  const app = createApp({
    routes: [
      { path: '/health', router: container.resolve('healthRouter') },
      { path: '/api/v1/auth', router: container.resolve('authRouter') },
      {
        path: '/api/v1/users',
        router: container.resolve('userRouter'),
        middleware: [container.resolve('authenticationMiddleware').authenticateUser],
      },
      {
        path: '/api/v1/jobs',
        router: container.resolve('jobsRouter'),
        middleware: [container.resolve('authenticationMiddleware').authenticateUser],
      },
    ],
    loggerService,
    configService,
  });
  container.register('app', app);

  return container;
};

module.exports = { createContainerRegistry };
