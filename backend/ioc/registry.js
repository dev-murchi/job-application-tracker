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

const mongoose = require('mongoose');

const createConnectionManager = require('../db/connection-manager');
const { createMongoConnectionAdapter } = require('../db/adapters/mongo.adapter');
const { createDbService } = require('../db/db-service');
const { createUserSchema, createJobSchema } = require('../models');

// Services
const {
  createAuthService,
  createJobService,
  createUserService,
  createHealthService,
  createJwtService,
} = require('../services');

// Controllers
const {
  createAuthController,
  createJobsController,
  createUserController,
  createHealthController,
} = require('../controllers');

// Middleware
const { createAuthenticationMiddleware } = require('../middleware/auth');

// Routes
const { createAuthRouter } = require('../routes/auth');
const { createJobsRouter } = require('../routes/jobs');
const { createUserRouter } = require('../routes/user');
const { createHealthRouter } = require('../routes/health');

// App
const { createApp } = require('../app');
const { createContainerInstance } = require('./container');

/**
 * Build and wire the full application container.
 *
 * @param {{ configService: object, loggerService: object, connection?: object }} deps
 *   connection — optional pre-existing mongoose connection (used in tests)
 * @returns {Promise<object>} Fully wired container
 */
const createContainerRegistry = async ({ configService, loggerService, connection = null }) => {
  const container = createContainerInstance();

  // Register core services
  container.register('configService', configService);
  container.register('loggerService', loggerService);

  const mongoUrl = configService.get('mongoUrl');

  // ============================================
  // DATABASE LAYER
  // ============================================

  const mongooseConnection = connection || mongoose.createConnection();
  container.register('connection', mongooseConnection);

  const mongoAdapter = createMongoConnectionAdapter({
    connection: mongooseConnection,
    configService,
    loggerService,
  });

  const dbConnectionManager = createConnectionManager({ adapter: mongoAdapter });
  container.register('dbConnectionManager', dbConnectionManager, () =>
    dbConnectionManager.closeConnection(),
  );

  if (!connection) {
    await dbConnectionManager.connect(mongoUrl);
  }

  const UserSchema = createUserSchema({ configService: container.resolve('configService') });
  const JobSchema = createJobSchema({ configService: container.resolve('configService') });

  const dbService = createDbService(mongooseConnection);
  dbService.createModel('User', UserSchema);
  dbService.createModel('Job', JobSchema);
  container.register('dbService', dbService);

  // JWT
  const jwtService = createJwtService({ configService: container.resolve('configService') });
  container.register('jwtService', jwtService);

  // ============================================
  // BUSINESS LAYER (Services)
  // ============================================
  container.register('authService', createAuthService({ dbService, jwtService }));
  container.register('jobService', createJobService({ dbService }));
  container.register('userService', createUserService({ dbService }));
  container.register('healthService', createHealthService({ dbConnectionManager, configService }));

  // ============================================
  // PRESENTATION LAYER (Controllers)
  // ============================================
  container.register(
    'authController',
    createAuthController({
      authService: container.resolve('authService'),
      configService: container.resolve('configService'),
    }),
  );
  container.register(
    'jobsController',
    createJobsController({ jobService: container.resolve('jobService') }),
  );
  container.register(
    'userController',
    createUserController({ userService: container.resolve('userService') }),
  );
  container.register(
    'healthController',
    createHealthController({ healthService: container.resolve('healthService') }),
  );

  // ============================================
  // ROUTING LAYER
  // ============================================
  container.register(
    'authRouter',
    createAuthRouter({
      authController: container.resolve('authController'),
      configService: container.resolve('configService'),
    }),
  );
  container.register(
    'jobsRouter',
    createJobsRouter({ jobsController: container.resolve('jobsController') }),
  );
  container.register(
    'userRouter',
    createUserRouter({ userController: container.resolve('userController') }),
  );
  container.register(
    'healthRouter',
    createHealthRouter({ healthController: container.resolve('healthController') }),
  );

  // ============================================
  // MIDDLEWARE
  // ============================================
  container.register(
    'authenticationMiddleware',
    createAuthenticationMiddleware({ dbService, loggerService, jwtService }),
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
