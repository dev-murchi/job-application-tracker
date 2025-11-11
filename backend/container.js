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
const { UserSchema, JobSchema } = require('./models');

// Services
const {
  createAuthService,
  createJobService,
  createUserService,
  createHealthService,
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
 * Creates and wires all application dependencies
 *
 * @param {Object} options - Configuration options
 * @param {string} options.mongoUrl - MongoDB connection URL
 * @param {boolean} options.isProduction - Production mode flag
 * @param {mongoose.Connection} [options.connection] - Optional existing connection (for testing)
 * @returns {Promise<Object>} Container with all wired dependencies
 */
const createContainer = async (options) => {
  const {
    mongoUrl,
    isProduction = false,
    connection = null, // Allow injecting existing connection for tests
  } = options;

  // ============================================
  // 1. DATABASE LAYER
  // ============================================

  // Create or use provided connection
  const mongooseConnection = connection || mongoose.createConnection();

  // Create connection manager
  const dbConnectionManager = createConnectionManager({
    connection: mongooseConnection,
    config: { isProduction },
  });

  // Connect to database (skip if connection already connected - for tests)
  if (!connection) {
    await dbConnectionManager.connect(mongoUrl);
  }

  // Create database service with models
  const dbService = createDbService(mongooseConnection);
  dbService.createModel('User', UserSchema);
  dbService.createModel('Job', JobSchema);

  // ============================================
  // 2. BUSINESS LOGIC LAYER (Services)
  // ============================================

  const authService = createAuthService(dbService);
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

  const authenticateUser = createAuthenticateUser(dbService);

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
