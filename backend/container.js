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
const { createAuthenticateUser } = require('./middleware/auth');

// Routes
const { createAuthRouter } = require('./routes/auth');
const { createJobsRouter } = require('./routes/jobs');
const { createUserRouter } = require('./routes/user');
const { createHealthRouter } = require('./routes/health');

// App
const { createApp } = require('./app');

/**
 * Create and wire all application dependencies
 * @param {Object} options - Container configuration options
 * @param {Object} options.logger - Applicatin configurations
 * @param {string} options.config - MongoDB connection URL
 * @param {boolean} [options.isProduction=false] - Whether running in production mode
 * @param {Object} [options.connection=null] - Existing mongoose connection (for tests)
 * @returns {Promise<Object>} Container with all wired dependencies
 */
const createContainer = async (options) => {
  const {
    logger,
    config,
    connection = null, // Allow injecting existing connection for tests
  } = options;

  const { mongoUrl, isProduction, jwtSecret, jwtLifetime } = config;

  // ============================================
  // 1. DATABASE LAYER
  // ============================================

  // Create or use provided connection
  const mongooseConnection = connection || mongoose.createConnection();

  // Create connection manager
  const dbConnectionManager = createConnectionManager({
    connection: mongooseConnection,
    config: { isProduction },
    logger: logger,
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

  const authService = createAuthService(dbService, jwtService);
  const jobService = createJobService(dbService);
  const userService = createUserService(dbService);
  const healthService = createHealthService(dbConnectionManager);

  // ============================================
  // 3. PRESENTATION LAYER (Controllers)
  // ============================================

  const authController = createAuthController(authService);
  const jobsController = createJobsController(jobService);
  const userController = createUserController(userService);
  const healthController = createHealthController(healthService);

  // ============================================
  // 4. ROUTING LAYER
  // ============================================

  const authRouter = createAuthRouter(authController);
  const jobsRouter = createJobsRouter(jobsController);
  const userRouter = createUserRouter(userController);
  const healthRouter = createHealthRouter(healthController);

  // ============================================
  // 5. MIDDLEWARE
  // ============================================

  const authenticateUser = createAuthenticateUser(dbService, jwtService, logger);

  // ============================================
  // 6. APPLICATION
  // ============================================

  const app = createApp({
    routes: [
      { path: '/health', router: healthRouter },
      { path: '/api/v1/auth', router: authRouter },
      { path: '/api/v1/users', router: userRouter, middleware: [authenticateUser] },
      { path: '/api/v1/jobs', router: jobsRouter, middleware: [authenticateUser] },
    ],
    logger: logger,
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
