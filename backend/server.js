const config = require('./config');
const logger = require('./utils/logger');
const mongoose = require('mongoose');
const createConnectionManager = require('./db/connect');
const dbService = require('./db/db-service');
const { UserSchema, JobSchema } = require('./models');
const http = require('http');

// Magic numbers as constants
const SECOND_IN_MS = 1000;
const KEEP_ALIVE_TIMEOUT_SECONDS = 61;
const HEADERS_TIMEOUT_SECONDS = 65;
const GRACEFUL_SHUTDOWN_TIMEOUT_SECONDS = 30;

const KEEP_ALIVE_TIMEOUT_MS = KEEP_ALIVE_TIMEOUT_SECONDS * SECOND_IN_MS;
const HEADERS_TIMEOUT_MS = HEADERS_TIMEOUT_SECONDS * SECOND_IN_MS;
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = GRACEFUL_SHUTDOWN_TIMEOUT_SECONDS * SECOND_IN_MS;

const createConfiguredServer = (requestListener, keepAliveTimeout, headersTimeout) => {
  const server = http.createServer(requestListener);
  server.keepAliveTimeout = keepAliveTimeout;
  server.headersTimeout = headersTimeout;
  return server;
};

const listenServer = (server, port) => {
  server.listen(port, () => {
    logger.info(`Server running on port ${port} in ${config.nodeEnv} mode`, {
      port,
      environment: config.nodeEnv,
      processId: process.pid,
      nodeVersion: process.version,
    });
  });
};

const createGracefulServerShutdownHandler = (server, cleanUpFn) => async (signal) => {
  logger.info(`${signal} received, initiating graceful shutdown`);

  // Force shutdown timeout
  const timeout = setTimeout(() => {
    logger.error('Graceful shutdown timed out, forcing exit');
    process.exit(1);
  }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);

  // Stop accepting new connections
  if (server.listening) {
    server.close(async (err) => {
      if (err) {
        logger.error('Error while closing HTTP server during shutdown', {
          error: err.message,
        });
        clearTimeout(timeout);
        process.exit(1);
      }

      logger.info('HTTP server closed successfully');

      let exitCode = 1; // Default to failure
      try {
        await cleanUpFn();
        exitCode = 0;
        logger.info('Cleanup function executed successfully');
      } catch (error) {
        logger.error('Error during cleanup', { error: error.message });
      } finally {
        clearTimeout(timeout);
        process.exit(exitCode);
      }
    });
  } else {
    logger.info('Server is not listening, proceeding with cleanup');
    let exitCode = 1; // Default to failure
    try {
      await cleanUpFn();
      exitCode = 0;
      logger.info('Cleanup function executed successfully');
    } catch (error) {
      logger.error('Error during cleanup', { error: error.message });
    } finally {
      clearTimeout(timeout);
      process.exit(exitCode);
    }
  }
};

const setupProcessHandlers = (shutdownHandler) => {
  const handleFatal = (signal) => (error, promise) => {
    const errorInfo = error instanceof Error ? error.message : promise || error;
    const stack = config.isDevelopment && error instanceof Error ? error.stack : undefined;

    const type = signal === 'UNCAUGHT_EXCEPTION' ? 'Uncaught Exception' : 'Unhandled Rejection';
    logger.error(type, { reason: errorInfo, stack });

    shutdownHandler(signal);
  };

  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));
  process.on('uncaughtException', handleFatal('UNCAUGHT_EXCEPTION'));
  process.on('unhandledRejection', handleFatal('UNHANDLED_REJECTION'));
};

const startServer = async () => {
  try {
    // create models
    dbService.createModel(mongoose.connection, 'User', UserSchema);
    dbService.createModel(mongoose.connection, 'Job', JobSchema);

    // Database connection
    const connectionManager = createConnectionManager(mongoose.connection, {
      isProduction: config.isProduction,
    });
    await connectionManager.connect(config.mongoUrl);
    logger.info('Database connection established successfully');

    // Server creation
    const { app } = require('./app');
    const server = createConfiguredServer(app, KEEP_ALIVE_TIMEOUT_MS, HEADERS_TIMEOUT_MS);

    // Set up process handlers for graceful shutdown.
    setupProcessHandlers(
      createGracefulServerShutdownHandler(server, connectionManager.closeConnection),
    );

    // Start listening
    listenServer(server, config.port);

    return server;
  } catch (error) {
    // Log and exit on startup failure
    logger.error('Failed to start server', {
      error: error.message,
      stack: config.isDevelopment ? error.stack : undefined,
    });
    process.exit(1);
  }
};

startServer();
