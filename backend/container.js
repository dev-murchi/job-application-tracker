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
 * Container factory - builds and wires all dependencies
 * @param {Object} dependencies - Container dependency object
 * @param {Object} dependencies.configService - Configuration service
 * @param {Object} dependencies.loggerService - Logger service
 * @param {Object} [dependencies.connection] - Existing mongoose connection (for testing)
 * @returns {Promise<Object>} Container instance
 */
const createContainer = async ({ configService, loggerService, connection = null }) => {
  const mongoUrl = configService.get('mongoUrl');
  const isProduction = configService.get('isProduction');
  const jwtSecret = configService.get('jwtSecret');
  const jwtLifetime = configService.get('jwtLifetime');

  // ============================================
  // 1. DATABASE LAYER
  // ============================================

  // Create or use provided connection
  const mongooseConnection = connection || mongoose.createConnection();

  // Create connection manager
  const dbConnectionManager = createConnectionManager({
    connection: mongooseConnection,
    config: { isProduction },
    loggerService,
  });

  // Connect to database (skip if connection already connected - for tests)
  if (!connection) {
    await dbConnectionManager.connect(mongoUrl);
  }

  // Create databases ervice with models
  const dbService = createDbService(mongooseConnection);
  const userSchema = createUserSchema({ autoIndex: !isProduction });
  const jobSchema = createJobSchema({ autoIndex: !isProduction });
  dbService.createModel('User', userSchema);
  dbService.createModel('Job', jobSchema);

  // ============================================
  // 2. BUSINESS LOGIC LAYER (Services)
  // ============================================

  const jwtService = createJwtService({
    secret: jwtSecret,
    expiresIn: jwtLifetime,
  });

  const authService = createAuthService({ dbService, jwtService });
  const jobService = createJobService(dbService);
  const userService = createUserService(dbService);
  const healthService = createHealthService({
    dbConnectionManager,
    configService,
  });

  // ============================================
  // 3. PRESENTATION LAYER (Controllers)
  // ============================================

  const authController = createAuthController({ authService, configService });
  const jobsController = createJobsController(jobService);
  const userController = createUserController(userService);
  const healthController = createHealthController(healthService);

  // ============================================
  // 4. ROUTING LAYER
  // ============================================

  const authRouter = createAuthRouter({ authController, configService });
  const jobsRouter = createJobsRouter(jobsController);
  const userRouter = createUserRouter(userController);
  const healthRouter = createHealthRouter(healthController);

  // ============================================
  // 5. MIDDLEWARE
  // ============================================

  const authenticationMiddleware = createAuthenticationMiddleware({
    dbService,
    jwtService,
    loggerService,
  });

  // ============================================
  // 6. APPLICATION
  // ============================================

  const app = createApp({
    routes: [
      { path: '/health', router: healthRouter },
      { path: '/api/v1/auth', router: authRouter },
      {
        path: '/api/v1/users',
        router: userRouter,
        middleware: [authenticationMiddleware.authenticateUser],
      },
      {
        path: '/api/v1/jobs',
        router: jobsRouter,
        middleware: [authenticationMiddleware.authenticateUser],
      },
    ],
    loggerService,
    configService,
  });

  // ============================================
  // RETURN CONTAINER
  // ============================================

  return {
    // Infrastructure
    connection: mongooseConnection,
    dbConnectionManager,
    dbService,

    // Services
    authService,
    jobService,
    userService,
    healthService,
    jwtService,
    configService,
    loggerService,

    // Controllers
    authController,
    jobsController,
    userController,
    healthController,

    // Routers
    authRouter,
    jobsRouter,
    userRouter,
    healthRouter,

    // Application
    app,

    // Utility methods
    async dispose() {
      await dbConnectionManager.closeConnection();
    },
  };
};

module.exports = {
  createContainer,
};
