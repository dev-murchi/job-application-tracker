/**
 * Application Bootstrap - Composition Root Orchestrator
 */

const {
  createEnvironmentConfigSource,
  createConfigService,
} = require('./adapters/infrastructure/config');
const { createContainerRegistry } = require('./ioc/registry');
const { createHttpServer } = require('./adapters/presentations/http-server/server');
const { ConfigSchema } = require('./shared/schemas');
const { GRACEFUL_SHUTDOWN_TIMEOUT_MS, REQUEST_TIMEOUT_BUFFER_MS } = require('./shared/constants');
const { createLoggerService } = require('./adapters/infrastructure/logger/winston/logger');
const { DB_CONNECTION_MANAGER_PORT, EXPRESS_APP } = require('./ioc/di-tokens');

const FORCE_EXIT_TIMEOUT = GRACEFUL_SHUTDOWN_TIMEOUT_MS + REQUEST_TIMEOUT_BUFFER_MS;

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
      loggerService.error(`Shutdown timed out (${FORCE_EXIT_TIMEOUT}ms). Forcing process exit.`);
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
    const rawConfig = createEnvironmentConfigSource().read();
    const configService = createConfigService();
    configService.loadConfig(ConfigSchema, rawConfig);

    // 2. Create logger service
    loggerService = createLoggerService({ configService });

    loggerService.info('Bootstrapping application');

    // 3. Initialize IoC container
    container = await createContainerRegistry({
      configService,
      loggerService,
    });

    // 4. Connect to database
    const dbConnectionManager = container.resolve(DB_CONNECTION_MANAGER_PORT);
    await dbConnectionManager.connect(configService.get('mongoUrl'));

    // 5. Create and start HTTP server
    httpServer = createHttpServer({
      configService,
      loggerService,
    });

    const expressApp = container.resolve(EXPRESS_APP);

    // Start listening
    await httpServer.start(expressApp, () => container.dispose());

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
