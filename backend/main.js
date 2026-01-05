/**
 * Application Bootstrap - Composition Root Orchestrator
 */

const config = require('./config');
const { createContainer } = require('./container');
const { createHttpServer } = require('./server');
const { ConfigSchema } = require('./schemas');
const { createConfigService } = require('./services');
const { createLoggerService } = require('./utils');

const FORCE_EXIT_TIMEOUT = 10_000;

/**
 * Main Bootstrap Function
 * Responsible for initializing services and starting the server.
 */
const bootstrap = async () => {
  let container = null;
  let loggerService = console; // Initial fallback for early error
  let isShuttingDown = false;
  let httpServer = null;

  const handleShutdown = async (signal) => {
    // Prevent multiple shutdown flows
    if (isShuttingDown) {
      loggerService.warn(`Shutdown already in progress. Ignoring repeated signal: ${signal}`);
      return;
    }

    isShuttingDown = true;
    loggerService.info(`Received ${signal}. Starting graceful shutdown`);

    // Force exit if shutdown hangs
    const forceExitTimeout = setTimeout(() => {
      loggerService.error('Shutdown timed out (10s). Forcing process exit.');
      process.exit(1);
    }, FORCE_EXIT_TIMEOUT);

    try {
      // 1. Stop accepting new HTTP requests
      if (httpServer) {
        await httpServer.stop();
      }

      // 2. Dispose infrastructure
      if (container) {
        loggerService.info('Disposing container resources');
        await container.dispose();
        loggerService.info('Container resources disposed.');
      }

      clearTimeout(forceExitTimeout);
      loggerService.info('Graceful shutdown completed successfully.');
      process.exit(0);
    } catch (error) {
      loggerService.error('Error occurred during graceful shutdown:', {
        message: error.message,
        stack: error.stack,
      });
      process.exit(1);
    }
  };

  try {
    // 1. Create configuration service
    const configService = createConfigService();
    configService.loadConfig(ConfigSchema, config);

    // 2. Create logger service
    loggerService = createLoggerService({
      isProduction: configService.get('isProduction'),
      logLevel: configService.get('logLevel'),
    });

    loggerService.info('Bootstrapping application');

    // 3. Initialize IoC container
    container = await createContainer({
      configService,
      loggerService,
    });

    // 4. Create and start HTTP server
    httpServer = createHttpServer({
      configService,
      loggerService,
    });

    const app = container.resolve('app');

    // Start listening
    await httpServer.start(app, () => container.dispose());

    loggerService.info('Application bootstrap complete');

    // Listen for Termination Signals
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

    // Critical Error Handling
    process.on('uncaughtException', (error) => {
      loggerService.error('Uncaught Exception:', error);
      handleShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      loggerService.error('Unhandled Rejection:', reason);
      handleShutdown('unhandledRejection');
    });

    return { container, httpServer, loggerService };
  } catch (error) {
    loggerService.error('Bootstrap failed:', {
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
    await handleShutdown('BOOTSTRAP_FAILED');
  }
};

bootstrap().then();
