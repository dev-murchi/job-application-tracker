const config = require('./config');

require('express-async-errors');

// Core dependencies
const express = require('express');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');

// Security middleware imports
const helmet = require('helmet');
const xss = require('xss-clean');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

// Custom middleware imports
const authenticateUser = require('./middleware/auth');
const notFoundMiddleware = require('./middleware/not-found');
const errorHandlerMiddleware = require('./middleware/error-handler');

// Route imports
const authRouter = require('./routes/auth');
const userRouter = require('./routes/user');
const jobsRouter = require('./routes/jobs');

// Utilities
const logger = require('./utils/logger');
const connectDB = require('./db/connect');

// Rate limiter configurations
const appLevelRateLimit = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message:
    'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Initialize express app
const app = express();

// Morgan logger configuration
const morganStream = {
  write: (message) => logger.info(message.trim()),
};

// Middleware setup
const setupMiddleware = (app) => {
  app.use(express.json({ 
    limit: config.requestSizeLimit,
    parameterLimit: 100,
    type: ['application/json', 'application/json-patch+json']
  }));
  
  app.use(express.urlencoded({ 
    extended: true,
    limit: config.requestSizeLimit,
    parameterLimit: 100
  }));

  app.use(
    morgan(config.isProduction ? 'combined' : 'dev', { stream: morganStream })
  );
  app.use(helmet());
  app.use(xss());
  app.use(mongoSanitize());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
    })
  );
  app.use(cookieParser());

  if (config.isProduction) {
    app.use(appLevelRateLimit);
  }
};

// Route setup
const setupRoutes = (app) => {
  app.get('/', (req, res) => res.send('home'));
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/users', authenticateUser, userRouter);
  app.use('/api/v1/jobs', authenticateUser, jobsRouter);
  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);
};

// Server reference for graceful shutdown
let server;

// Server startup
const startServer = async () => {
  try {
    await connectDB(config.mongoUrl);
    logger.info('CONNECTED TO DB!!!');
    server = app.listen(config.port, () =>
      logger.info(`Server is listening on port ${config.port}...`)
    );
  } catch (error) {
    logger.error(error.stack || error);
    process.exit(1);
  }
};

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  if (server) {
    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        await require('mongoose').connection.close();
        logger.info('MongoDB connection closed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    });

    // Force shutdown after 30 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 30000);
  } else {
    process.exit(0);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

// Initialize application
setupMiddleware(app);
setupRoutes(app);
startServer();
