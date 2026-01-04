/**
 * Dependency Container / IoC Container
 *
 * This module is the "Composition Root" - the single place where all
 * dependencies are created and wired together.
 *
 * Benefits:
 * - Centralized dependency management
 * - Easy to swap implementations (dev/test/prod)
 * - Clear dependency graph visualization
 * - Configurable for different environments
 */

const mongoose = require('mongoose');
const createConnectionManager = require('./db/connect');
const { createDbService } = require('./db/db-service');
const { createUserSchema, createJobSchema } = require('./models');

// Services
const {
  createAuthService,
  createJobService,
  createUserService,
  createHealthService,
  createJwtService,
} = require('./services');

// Controllers
const {
  createAuthController,
  createJobsController,
  createUserController,
  createHealthController,
} = require('./controllers');

// Middleware
const { createAuthenticationMiddleware } = require('./middleware/auth');

// Routes
const { createAuthRouter } = require('./routes/auth');
const { createJobsRouter } = require('./routes/jobs');
const { createUserRouter } = require('./routes/user');
const { createHealthRouter } = require('./routes/health');

// App
const { createApp } = require('./app');

/**
 * Create a lightweight dependency container instance.
 * The returned object provides simple registration and resolution
 * semantics and a controlled dispose/cleanup operation.
 *
 * @returns {{
 *   register: (name: string, instance: any) => void,
 *   resolve: (name: string) => any,
 *   has: (name: string) => boolean,
 *   dispose: () => Promise<void>,
 *   isDisposed: () => boolean,
 * }} A container instance with lifecycle helpers
 */
const createContainerInstance = () => {
  const dependencies = new Map();
  let disposed = false;

  return {
    register: (name, instance) => {
      if (disposed) {
        throw new Error('Container has been disposed');
      }
      dependencies.set(name, instance);
    },

    resolve: (name) => {
      if (!dependencies.has(name)) {
        throw new Error(`Dependency ${name} not registered`);
      }

      return dependencies.get(name);
    },

    has: (name) => dependencies.has(name),

    dispose: async () => {
      if (disposed) {
        return;
      }
      const dbConnectionManager = dependencies.get('dbConnectionManager');
      if (dbConnectionManager) {
        await dbConnectionManager.closeConnection();
      }
      dependencies.clear();
      disposed = true;
    },

    isDisposed: () => disposed,
  };
};

/**
 * Container factory - build and wire all application dependencies.
 * This factory initializes database connections, registers services,
 * controllers, routes, middleware and returns a ready-to-use container.
 *
 * @param {Object} options - Container dependencies and options
 * @param {Object} options.configService - Configuration service instance
 * @param {Object} options.loggerService - Logger service instance
 * @param {import('mongoose').Connection} [options.connection] - Optional mongoose connection (used for tests)
 * @returns {Promise<{
 *   register: (name: string, instance: any) => void,
 *   resolve: (name: string) => any,
 *   has: (name: string) => boolean,
 *   dispose: () => Promise<void>,
 *   isDisposed: () => boolean,
 * }>} A fully configured container instance
 */
const createContainer = async ({ configService, loggerService, connection = null }) => {
  const container = createContainerInstance();

  // Register core services
  container.register('configService', configService);
  container.register('loggerService', loggerService);

  const mongoUrl = configService.get('mongoUrl');
  const isProduction = configService.get('isProduction');
  const jwtSecret = configService.get('jwtSecret');
  const jwtLifetime = configService.get('jwtLifetime');

  // ============================================
  // DATABASE LAYER
  // ============================================

  const mongooseConnection = connection || mongoose.createConnection();
  container.register('connection', mongooseConnection);

  const dbConnectionManager = createConnectionManager({
    connection: mongooseConnection,
    config: { isProduction: isProduction },
    loggerService,
  });

  container.register('dbConnectionManager', dbConnectionManager);

  if (!connection) {
    await dbConnectionManager.connect(mongoUrl);
  }

  const UserSchema = createUserSchema({ autoIndex: !isProduction });
  const JobSchema = createJobSchema({ autoIndex: !isProduction });

  const dbService = createDbService(mongooseConnection);
  dbService.createModel('User', UserSchema);
  dbService.createModel('Job', JobSchema);
  container.register('dbService', dbService);

  // JWT
  const jwtService = createJwtService({
    secret: jwtSecret,
    expiresIn: jwtLifetime,
  });
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
      configService,
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
      configService,
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

module.exports = {
  createContainerInstance,
  createContainer,
};
