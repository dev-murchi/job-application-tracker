const http = require('http');

const {
  KEEP_ALIVE_TIMEOUT_MS,
  HEADERS_TIMEOUT_MS,
  GRACEFUL_SHUTDOWN_TIMEOUT_MS,
  REQUEST_TIMEOUT_BUFFER_MS,
} = require('./constants');

/**
 * No-op async function used as a default cleanup hook.
 * @returns {Promise<void>}
 */
const noopAsync = async () => {};

/**
 * Node HTTP timeouts overview (production basics):
 * - server.headersTimeout: max time allowed to receive the full HTTP headers.
 * - server.requestTimeout: max time allowed for the entire request.
 * - server.keepAliveTimeout: how long to keep idle keep-alive sockets around.
 *
 * Recommendation:
 * - requestTimeout should be >= headersTimeout
 * - requestTimeout should usually be >= keepAliveTimeout (+buffer) to avoid surprising timeouts
 */
const REQUEST_TIMEOUT_MS = Math.max(
  HEADERS_TIMEOUT_MS,
  KEEP_ALIVE_TIMEOUT_MS + REQUEST_TIMEOUT_BUFFER_MS,
);

const assertFunction = (value, name) => {
  if (typeof value !== 'function') {
    throw new Error(`${name} must be a function`);
  }
};

const createLogger = (loggerService) => {
  const log = (level, message, meta = {}) => {
    const fn =
      loggerService && typeof loggerService[level] === 'function' ? loggerService[level] : null;
    if (fn) {
      fn.call(loggerService, message, meta);
      return;
    }
    loggerService.info(message, meta);
  };

  return { log };
};

const createServerConfig = () => ({
  keepAliveTimeoutMs: KEEP_ALIVE_TIMEOUT_MS,
  headersTimeoutMs: HEADERS_TIMEOUT_MS,
  requestTimeoutMs: REQUEST_TIMEOUT_MS,
});

const applyServerTimeouts = (server, config) => {
  server.keepAliveTimeout = config.keepAliveTimeoutMs;
  server.headersTimeout = config.headersTimeoutMs;
  server.requestTimeout = config.requestTimeoutMs;
};

const createServerInstance = ({ requestHandler }) => {
  const server = http.createServer(requestHandler);
  applyServerTimeouts(server, createServerConfig());
  return server;
};

const createSocketTracker = ({ log }) => {
  const sockets = new Set();

  const remove = (socket) => {
    sockets.delete(socket);
    log('debug', 'Socket removed from tracking', {
      remoteAddress: socket?.remoteAddress,
      remotePort: socket?.remotePort,
      sockets: sockets.size,
    });
  };

  const add = (socket) => {
    sockets.add(socket);
    log('debug', 'New connection accepted', {
      remoteAddress: socket?.remoteAddress,
      remotePort: socket?.remotePort,
      sockets: sockets.size,
    });

    if (typeof socket?.setKeepAlive === 'function') {
      socket.setKeepAlive(true);
    }

    socket.on('close', () => remove(socket));
    socket.on('error', () => remove(socket));
  };

  const forceClose = (server) => {
    if (!server) {
      return;
    }

    if (typeof server.closeIdleConnections === 'function') {
      server.closeIdleConnections();
    }
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }

    sockets.forEach((socket) => {
      if (socket && !socket.destroyed) {
        socket.destroy();
      }
    });
  };

  return {
    sockets,
    add,
    remove,
    forceClose,
    clear: () => sockets.clear(),
    size: () => sockets.size,
  };
};

const attachServerHandlers = ({ server, sockets, log }) => {
  server.on('connection', sockets.add);

  server.on('clientError', (error, socket) => {
    log('warn', 'Client connection error', {
      error: error?.message,
      code: error?.code,
      bytesParsed: error?.bytesParsed,
      remoteAddress: socket?.remoteAddress,
      remotePort: socket?.remotePort,
      sockets: sockets.size(),
    });

    if (socket && socket.writable) {
      try {
        socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
      } catch (writeError) {
        log('error', 'Failed to respond to client error', { error: writeError.message });
      }
    }

    if (socket) {
      socket.destroy();
    }
  });

  server.on('error', (error) => {
    log('error', 'HTTP server encountered an error', {
      error: error?.message,
      code: error?.code,
      syscall: error?.syscall,
      stack: error?.stack,
      sockets: sockets.size(),
    });
  });

  server.once('close', () => log('info', 'HTTP server closed'));
};

const listenAsync = ({ server, port }) =>
  new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off('listening', onListening);
      reject(error);
    };

    const onListening = () => {
      server.off('error', onError);
      resolve();
    };

    server.once('error', onError);
    server.once('listening', onListening);

    try {
      server.listen(port);
    } catch (error) {
      server.off('error', onError);
      server.off('listening', onListening);
      reject(error);
    }
  });

const closeAsync = (server) =>
  new Promise((resolve) => {
    server.close((error) => resolve(error));
  });

const createGraceTimer = ({ graceMs, onExpire }) => {
  const timer = setTimeout(onExpire, graceMs);
  return () => clearTimeout(timer);
};

const runCleanup = async ({ onClose, log }) => {
  try {
    await onClose();
    log('info', 'HTTP server cleanup completed');
  } catch (error) {
    log('error', 'Cleanup function failed', { error: error?.message });
  }
};

/**
 * HTTP Server wrapper - create a restartable, production-friendly HTTP server wrapper.
 *
 * @param {Object} dependencies - Wrapper dependencies
 * @param {Object} dependencies.configService - Configuration service instance
 * @param {Object} dependencies.loggerService - Logger service instance
 * @returns {{
 *  start: (requestHandler: function, onClose?: function) => Promise<void>,
 *  stop: (options?: { graceMs?: number, force?: boolean }) => Promise<void>,
 *  restart: (options?: { requestHandler?: function, onClose?: function }) => Promise<void>,
 *  isListening: () => boolean,
 * }} A restartable, production-friendly HTTP server wrapper
 */
const createHttpServer = ({ configService, loggerService }) => {
  if (!configService) {
    throw new Error('configService is required to create the HTTP server');
  }
  if (!loggerService) {
    throw new Error('loggerService is required to create the HTTP server');
  }

  const { log } = createLogger(loggerService);
  const sockets = createSocketTracker({ log });

  // Internal mutable state: server instance, lifecycle flags and current handler/cleanup hook
  let server = null;
  let starting = false;
  let stopping = false;

  let currentHandler = null;
  let currentOnClose = noopAsync;

  const assertStartable = () => {
    if (starting) {
      log('warn', 'HTTP server start already in progress');
      return false;
    }
    if (isListening()) {
      log('warn', 'HTTP server is already running');
      return false;
    }
    return true;
  };

  const assertStoppable = () => {
    if (!server) {
      log('info', 'HTTP server has not been started yet');
      return false;
    }
    if (!isListening()) {
      log('info', 'HTTP server is already stopped');
      return false;
    }
    if (stopping) {
      log('warn', 'HTTP server shutdown already in progress');
      return false;
    }
    return true;
  };

  const createAndWireServer = (requestHandler) => {
    const instance = createServerInstance({ requestHandler });
    attachServerHandlers({ server: instance, sockets, log });
    return instance;
  };

  const isListening = () => Boolean(server && server.listening);

  const start = async (requestHandler, onClose = noopAsync) => {
    assertFunction(requestHandler, 'requestHandler');
    assertFunction(onClose, 'onClose');

    if (!assertStartable()) {
      return;
    }

    // Prepare to start server: mark as starting and record handler/cleanup
    starting = true;
    currentHandler = requestHandler;
    currentOnClose = onClose;

    const port = configService.get('port');
    const environment = configService.get('nodeEnv');

    const startAt = Date.now();
    log('info', 'Starting HTTP server', { port, environment });

    server = createAndWireServer(requestHandler);

    try {
      await listenAsync({ server, port });

      log('info', 'HTTP server is listening', {
        port,
        environment,
        processId: process.pid,
        nodeVersion: process.version,
        startMs: Date.now() - startAt,
        sockets: sockets.size(),
      });
    } finally {
      starting = false;
      stopping = false;
    }
  };

  const stop = async ({ graceMs = GRACEFUL_SHUTDOWN_TIMEOUT_MS, force = false } = {}) => {
    if (!assertStoppable()) {
      return;
    }

    stopping = true;

    const socketsAtStart = sockets.size();
    const stopAt = Date.now();

    log('info', 'Initiating HTTP server shutdown', {
      sockets: socketsAtStart,
      graceMs,
      force,
    });

    const clearGraceTimer = createGraceTimer({
      graceMs,
      onExpire: () => {
        log('warn', 'Grace period elapsed, forcing connections to close', {
          graceMs,
          sockets: sockets.size(),
        });
        sockets.forceClose(server);
      },
    });

    if (force) {
      sockets.forceClose(server);
    }

    const closeError = await closeAsync(server);

    clearGraceTimer();

    if (closeError) {
      log('error', 'Error while closing HTTP server', { error: closeError.message });
    }

    await runCleanup({ onClose: currentOnClose, log });

    // Ensure no lingering sockets remain.
    sockets.forceClose(server);

    sockets.clear();
    server.removeAllListeners();
    server = null;

    stopping = false;

    log('info', 'HTTP server stopped', {
      stopMs: Date.now() - stopAt,
      forced: force,
      socketsAtStart,
    });
  };

  const restart = async ({ requestHandler = currentHandler, onClose = currentOnClose } = {}) => {
    log('info', 'Restarting HTTP server', { sockets: sockets.size() });
    await stop();
    await start(requestHandler, onClose);
    log('info', 'HTTP server restarted', { sockets: sockets.size() });
  };

  return {
    start,
    stop,
    restart,
    isListening,
  };
};

module.exports = {
  createHttpServer,
};
