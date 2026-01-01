const config = require('./config');
const { createLoggerService } = require('./utils');
const { createContainer } = require('./container');
const http = require('http');
const {
  KEEP_ALIVE_TIMEOUT_MS,
  HEADERS_TIMEOUT_MS,
  GRACEFUL_SHUTDOWN_TIMEOUT_MS,
} = require('./constants');

const createConfiguredServer = (requestListener, keepAliveTimeout, headersTimeout) => {
  const server = http.createServer(requestListener);
  server.keepAliveTimeout = keepAliveTimeout;
  server.headersTimeout = headersTimeout;
  return server;
};

/**
 * Start the HTTP server and listen on configured port
 * @param {http.Server} server - HTTP server instance
 * @param {number} port - Port number to listen on
 * @param {Object} logger - Logger instance for server logging
 */
const listenServer = (server, port, logger) => {
  server.listen(port, () => {
    logger.info(`Server running on port ${port} in ${config.nodeEnv} mode`, {
      port,
      environment: config.nodeEnv,
      processId: process.pid,
      nodeVersion: process.version,
    });
  });
};

/**
 * Create a graceful shutdown handler for the server
 * @param {http.Server} server - HTTP server instance
 * @param {Object} logger - Logger instance for shutdown logging
 * @param {Function} cleanUpFn - Async cleanup function (e.g., container.dispose)
 * @returns {Function} Signal handler function for graceful shutdown
 */
const createGracefulServerShutdownHandler = (server, logger, cleanUpFn) => async (signal) => {
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

/**
 * Set up process-level signal and error handlers
 * @param {Object} logger - Logger instance for process-level logging
 * @param {Function} shutdownHandler - Graceful shutdown handler function
 */
const setupProcessHandlers = (logger, shutdownHandler) => {
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
    // create a logger
    const logger = createLoggerService({
      logLevel: config.logLevel,
      isProduction: config.isProduction,
    });

    // Create and wire all dependencies via container
    logger.info('Initializing application container...');
    const container = await createContainer({
      logger: logger,
      mongoUrl: config.mongoUrl,
      isProduction: config.isProduction,
    });
    logger.info('Database connection established successfully');

    // Server creation
    const server = createConfiguredServer(container.app, KEEP_ALIVE_TIMEOUT_MS, HEADERS_TIMEOUT_MS);

    // Set up process handlers for graceful shutdown using container's dispose method
    setupProcessHandlers(
      logger,
      createGracefulServerShutdownHandler(server, logger, () => container.dispose()),
    );

    // Start listening
    listenServer(server, config.port, logger);

    return server;
  } catch (error) {
    // Log and exit on startup failure
    console.error('Failed to start server', {
      error: error.message,
      stack: config.isDevelopment ? error.stack : undefined,
    });
    process.exit(1);
  }
};

startServer();
