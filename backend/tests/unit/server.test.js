const { EventEmitter } = require('events');

jest.mock('http', () => ({ createServer: jest.fn() }));
const http = require('http');

const { KEEP_ALIVE_TIMEOUT_MS, HEADERS_TIMEOUT_MS } = require('../../constants');

const { createHttpServer } = require('../../server');

const REQUEST_TIMEOUT_BUFFER_MS = 5_000;
const EXPECTED_REQUEST_TIMEOUT_MS = Math.max(
  HEADERS_TIMEOUT_MS,
  KEEP_ALIVE_TIMEOUT_MS + REQUEST_TIMEOUT_BUFFER_MS,
);

/**
 * FakeServer - Mimics http.Server (extends net.Server)
 * Only uses real Node.js API properties/methods from the docs:
 * - listening (boolean property)
 * - listen(port) method
 * - close(callback) method
 * - closeIdleConnections() method (Node 18.2+)
 * - closeAllConnections() method (Node 18.2+)
 * - keepAliveTimeout, headersTimeout, requestTimeout properties
 * - Events: 'listening', 'error', 'close', 'connection', 'clientError'
 */
class FakeServer extends EventEmitter {
  constructor() {
    super();
    // Real http.Server property
    this.listening = false;

    // Real http.Server timeout properties (set by applyServerTimeouts)
    this.keepAliveTimeout = undefined;
    this.headersTimeout = undefined;
    this.requestTimeout = undefined;

    // Real http.Server methods (Node 18.2+)
    this.closeIdleConnections = jest.fn();
    this.closeAllConnections = jest.fn();

    // Internal test control (not part of real API)
    this._listenBehavior = 'success'; // 'success' | 'emitError' | 'throw'
    this._closeBehavior = 'immediate'; // 'immediate' | 'deferred'
    this._closeError = null;
    this._pendingCloseCallback = null;
  }

  // Real http.Server method
  listen(port) {
    this._port = port;

    if (this._listenBehavior === 'throw') {
      throw new Error('listen throw');
    }

    if (this._listenBehavior === 'emitError') {
      // Don't set listening = true on error
      setImmediate(() => {
        this.emit('error', Object.assign(new Error('listen error'), { code: 'EADDRINUSE' }));
      });
      return this;
    }

    // Success case
    this.listening = true;
    setImmediate(() => this.emit('listening'));
    return this;
  }

  // Real http.Server method (inherited from net.Server)
  close(callback) {
    if (this._closeBehavior === 'deferred') {
      this._pendingCloseCallback = callback;
      return this;
    }

    this.listening = false;
    setImmediate(() => {
      this.emit('close');
      if (callback) {
        callback(this._closeError);
      }
    });
    return this;
  }

  // Test helper to complete a deferred close
  _completeClose(error = this._closeError) {
    const cb = this._pendingCloseCallback;
    this._pendingCloseCallback = null;
    this.listening = false;
    this.emit('close');
    if (cb) {
      cb(error);
    }
  }
}

/**
 * FakeSocket - Mimics net.Socket
 * Only uses real Node.js API properties/methods from the docs:
 * - writable (boolean property)
 * - destroyed (boolean property)
 * - remoteAddress (string property)
 * - remotePort (number property)
 * - end([data]) method
 * - destroy([error]) method
 * - setKeepAlive([enable][, initialDelay]) method
 * - Events: 'close', 'error'
 */
class FakeSocket extends EventEmitter {
  constructor() {
    super();
    // Real net.Socket properties
    this.writable = true;
    this.destroyed = false;
    this.remoteAddress = '127.0.0.1';
    this.remotePort = 12345;

    // Real net.Socket methods
    this.setKeepAlive = jest.fn();
    this.end = jest.fn();
    this.destroy = jest.fn(() => {
      this.destroyed = true;
      this.emit('close');
    });
  }
}

const createConfigService = () => {
  const map = { port: 3001, nodeEnv: 'test' };
  return { get: jest.fn((key) => map[key]) };
};

const createLoggerService = (mode = 'full') => {
  if (mode === 'infoOnly') {
    return { info: jest.fn() };
  }

  if (mode === 'noDebug') {
    return { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  }

  return { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
};

describe('createHttpServer', () => {
  beforeEach(() => {
    http.createServer.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should throw when configService/loggerService are missing', () => {
    expect(() => createHttpServer({ configService: null, loggerService: {} })).toThrow(
      /configService is required/i,
    );
    expect(() => createHttpServer({ configService: {}, loggerService: null })).toThrow(
      /loggerService is required/i,
    );
  });

  it('should validate requestHandler and onClose types', async () => {
    const loggerService = createLoggerService('full');
    const configService = createConfigService();
    const httpServer = createHttpServer({ configService, loggerService });

    await expect(httpServer.start(123)).rejects.toThrow('requestHandler must be a function');
    await expect(httpServer.start(() => {}, 123)).rejects.toThrow('onClose must be a function');
  });

  it('should handle start-in-progress', async () => {
    const loggerService = createLoggerService('full');
    const configService = createConfigService();

    const fakeServer = new FakeServer();
    // Manual listen - won't emit 'listening' until we do it
    fakeServer._listenBehavior = 'success';

    http.createServer.mockImplementation(() => {
      // Override listen to not auto-emit
      fakeServer.listen = jest.fn((port) => {
        fakeServer._port = port;
        fakeServer.listening = true;
        // Don't emit 'listening' yet - simulate in-progress
        return fakeServer;
      });
      return fakeServer;
    });

    const testServer = createHttpServer({ configService, loggerService });

    const startPromise = testServer.start(() => {});

    // Give a tick for the first start to begin
    await new Promise((resolve) => {
      setImmediate(resolve);
    });

    // Second start while first is still in progress
    await testServer.start(() => {});

    expect(loggerService.warn).toHaveBeenCalledWith(
      'HTTP server start already in progress',
      expect.any(Object),
    );

    // Complete the first start
    fakeServer.emit('listening');
    await startPromise;

    expect(testServer.isListening()).toBe(true);
  });

  it('should handle logger fallback', async () => {
    // When debug method doesn't exist, should fallback to info
    const loggerService = createLoggerService('noDebug');
    const configService = createConfigService();

    const fakeServer = new FakeServer();
    http.createServer.mockImplementation(() => fakeServer);

    const testServer = createHttpServer({ configService, loggerService });

    await testServer.start(() => {});

    // Emit a connection - this triggers debug logging
    const socket = new FakeSocket();
    fakeServer.emit('connection', socket);

    // Since debug doesn't exist, it should fall back to info
    expect(loggerService.info).toHaveBeenCalledWith('New connection accepted', expect.any(Object));
  });

  it('should handle already-running guard', async () => {
    const loggerService = createLoggerService('full');
    const configService = createConfigService();

    const fakeServer = new FakeServer();
    http.createServer.mockImplementation(() => fakeServer);

    const testServer = createHttpServer({ configService, loggerService });

    await testServer.start(() => {});
    expect(testServer.isListening()).toBe(true);

    // Try to start again while already running
    await testServer.start(() => {});

    expect(loggerService.warn).toHaveBeenCalledWith(
      'HTTP server is already running',
      expect.any(Object),
    );
  });

  it('should handle listen errors (emit + throw) and allow a later successful start', async () => {
    const loggerService = createLoggerService('full');
    const configService = createConfigService();

    // First attempt: emit error
    const badServerEmit = new FakeServer();
    badServerEmit._listenBehavior = 'emitError';

    // Second attempt: throw
    const badServerThrow = new FakeServer();
    badServerThrow._listenBehavior = 'throw';

    // Third attempt: success
    const goodServer = new FakeServer();
    goodServer._listenBehavior = 'success';

    http.createServer
      .mockImplementationOnce(() => badServerEmit)
      .mockImplementationOnce(() => badServerThrow)
      .mockImplementationOnce(() => goodServer);

    const testServer = createHttpServer({ configService, loggerService });

    await expect(testServer.start(() => {})).rejects.toThrow(/listen error/i);
    await expect(testServer.start(() => {})).rejects.toThrow(/listen throw/i);

    await testServer.start(() => {});
    expect(testServer.isListening()).toBe(true);
  });

  it('should handle stop early-returns (not started / already stopped)', async () => {
    const loggerService = createLoggerService('full');
    const configService = createConfigService();
    const testServer = createHttpServer({ configService, loggerService });

    // Not started yet
    await testServer.stop();
    expect(loggerService.info).toHaveBeenCalledWith(
      'HTTP server has not been started yet',
      expect.any(Object),
    );

    // Start but with a fakeServer that doesn't actually listen
    const weirdServer = new FakeServer();
    weirdServer.listen = jest.fn((_port) => {
      // Emit listening but don't set listening = true
      setImmediate(() => weirdServer.emit('listening'));
      return weirdServer;
    });
    http.createServer.mockImplementationOnce(() => weirdServer);

    await testServer.start(() => {});
    expect(testServer.isListening()).toBe(false);

    await testServer.stop();
    expect(loggerService.info).toHaveBeenCalledWith(
      'HTTP server is already stopped',
      expect.any(Object),
    );
  });

  it('should handle stop with stopping-in-progress', async () => {
    jest.useFakeTimers();

    const loggerService = createLoggerService('full');
    const configService = createConfigService();

    const fakeServer = new FakeServer();
    fakeServer._closeBehavior = 'deferred';
    // Override listen to be synchronous for fake timers
    fakeServer.listen = jest.fn((port) => {
      fakeServer._port = port;
      fakeServer.listening = true;
      fakeServer.emit('listening');
      return fakeServer;
    });
    http.createServer.mockImplementation(() => fakeServer);

    const testServer = createHttpServer({ configService, loggerService });
    await testServer.start(() => {});

    // Start first stop (will be deferred)
    const stopPromise = testServer.stop({ graceMs: 1000 });

    // Try second stop while first is in progress
    const secondStopPromise = testServer.stop();
    // Run pending promises
    await Promise.resolve();

    expect(loggerService.warn).toHaveBeenCalledWith(
      'HTTP server shutdown already in progress',
      expect.any(Object),
    );

    // Complete the deferred close
    fakeServer._completeClose();

    // Run timers and microtasks
    jest.runAllTimers();
    await stopPromise;
    await secondStopPromise;
  });

  it('should handle stop with grace expiry, forceClose', async () => {
    jest.useFakeTimers();

    const loggerService = createLoggerService('full');
    const configService = createConfigService();

    const fakeServer = new FakeServer();
    fakeServer._closeBehavior = 'deferred';
    // Override listen to be synchronous for fake timers
    fakeServer.listen = jest.fn((port) => {
      fakeServer._port = port;
      fakeServer.listening = true;
      fakeServer.emit('listening');
      return fakeServer;
    });
    http.createServer.mockImplementation(() => fakeServer);

    const testServer = createHttpServer({ configService, loggerService });
    await testServer.start(() => {});

    // Add some connections
    const socket1 = new FakeSocket();
    const socket2 = new FakeSocket();
    fakeServer.emit('connection', socket1);
    fakeServer.emit('connection', socket2);

    // Start stop with short grace period
    const stopPromise = testServer.stop({ graceMs: 100, force: false });

    // Advance time past grace period
    jest.advanceTimersByTime(100);

    expect(loggerService.warn).toHaveBeenCalledWith(
      'Grace period elapsed, forcing connections to close',
      expect.any(Object),
    );
    expect(fakeServer.closeIdleConnections).toHaveBeenCalled();
    expect(fakeServer.closeAllConnections).toHaveBeenCalled();

    // Complete the close
    fakeServer._completeClose();

    // Run remaining timers
    jest.runAllTimers();
    await stopPromise;
  });

  it('should handle stop with clientError variants', async () => {
    const loggerService = createLoggerService('full');
    const configService = createConfigService();

    const fakeServer = new FakeServer();
    http.createServer.mockImplementation(() => fakeServer);

    const testServer = createHttpServer({ configService, loggerService });
    await testServer.start(() => {});

    // clientError: writable socket, end succeeds
    const socket1 = new FakeSocket();
    socket1.writable = true;
    fakeServer.emit(
      'clientError',
      Object.assign(new Error('parse error'), { code: 'HPE', bytesParsed: 10 }),
      socket1,
    );
    expect(socket1.end).toHaveBeenCalledWith('HTTP/1.1 400 Bad Request\r\n\r\n');
    expect(socket1.destroy).toHaveBeenCalled();

    // clientError: writable socket, end throws
    const socket2 = new FakeSocket();
    socket2.writable = true;
    socket2.end = jest.fn(() => {
      throw new Error('end failed');
    });
    fakeServer.emit('clientError', new Error('parse error 2'), socket2);
    expect(loggerService.error).toHaveBeenCalledWith(
      'Failed to respond to client error',
      expect.objectContaining({ error: 'end failed' }),
    );

    // clientError: non-writable socket
    const socket3 = new FakeSocket();
    socket3.writable = false;
    fakeServer.emit('clientError', new Error('parse error 3'), socket3);
    expect(socket3.end).not.toHaveBeenCalled();
    expect(socket3.destroy).toHaveBeenCalled();

    // clientError: no socket provided
    expect(() => fakeServer.emit('clientError', new Error('no socket'))).not.toThrow();

    await testServer.stop();
  });

  it('should handle stop with server error', async () => {
    const loggerService = createLoggerService('full');
    const configService = createConfigService();

    const fakeServer = new FakeServer();
    http.createServer.mockImplementation(() => fakeServer);

    const testServer = createHttpServer({ configService, loggerService });
    await testServer.start(() => {});

    // Emit a fakeServer error
    fakeServer.emit('error', Object.assign(new Error('fakeServer boom'), { code: 'ECONNRESET' }));

    expect(loggerService.error).toHaveBeenCalledWith(
      'HTTP server encountered an error',
      expect.objectContaining({
        error: 'fakeServer boom',
        code: 'ECONNRESET',
      }),
    );

    await testServer.stop();
  });

  it('should handle stop with cleanup success and failure', async () => {
    const loggerService = createLoggerService('full');
    const configService = createConfigService();

    // First: cleanup failure + close error
    const server1 = new FakeServer();
    server1._closeError = new Error('close failed');
    http.createServer.mockImplementationOnce(() => server1);

    const testServer = createHttpServer({ configService, loggerService });

    const failingCleanup = jest.fn(() => Promise.reject(new Error('cleanup boom')));
    await testServer.start(() => {}, failingCleanup);

    await testServer.stop();

    expect(loggerService.error).toHaveBeenCalledWith(
      'Error while closing HTTP server',
      expect.objectContaining({ error: 'close failed' }),
    );
    expect(loggerService.error).toHaveBeenCalledWith(
      'Cleanup function failed',
      expect.objectContaining({ error: 'cleanup boom' }),
    );

    // Second: cleanup success
    const server2 = new FakeServer();
    http.createServer.mockImplementationOnce(() => server2);

    const successCleanup = jest.fn(() => Promise.resolve());
    await testServer.start(() => {}, successCleanup);

    await testServer.stop();

    expect(successCleanup).toHaveBeenCalled();
    expect(loggerService.info).toHaveBeenCalledWith(
      'HTTP server cleanup completed',
      expect.any(Object),
    );
  });

  it('should restart using current handler/onClose defaults', async () => {
    const loggerService = createLoggerService('full');
    const configService = createConfigService();

    const server1 = new FakeServer();
    const server2 = new FakeServer();

    http.createServer.mockImplementationOnce(() => server1).mockImplementationOnce(() => server2);

    const testServer = createHttpServer({ configService, loggerService });

    const handler = jest.fn();
    const onClose = jest.fn(() => Promise.resolve());

    await testServer.start(handler, onClose);
    expect(testServer.isListening()).toBe(true);

    await testServer.restart();

    expect(http.createServer).toHaveBeenCalledTimes(2);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(testServer.isListening()).toBe(true);
    expect(loggerService.info).toHaveBeenCalledWith('Restarting HTTP server', expect.any(Object));
    expect(loggerService.info).toHaveBeenCalledWith('HTTP server restarted', expect.any(Object));
  });

  it('should apply fakeServer timeouts correctly', async () => {
    const loggerService = createLoggerService('full');
    const configService = createConfigService();

    const fakeServer = new FakeServer();
    http.createServer.mockImplementation(() => fakeServer);

    const testServer = createHttpServer({ configService, loggerService });
    await testServer.start(() => {});

    expect(fakeServer.keepAliveTimeout).toBe(KEEP_ALIVE_TIMEOUT_MS);
    expect(fakeServer.headersTimeout).toBe(HEADERS_TIMEOUT_MS);
    expect(fakeServer.requestTimeout).toBe(EXPECTED_REQUEST_TIMEOUT_MS);

    await testServer.stop();
  });

  it('should track connections and handle socket events', async () => {
    const loggerService = createLoggerService('full');
    const configService = createConfigService();

    const fakeServer = new FakeServer();
    http.createServer.mockImplementation(() => fakeServer);

    const testServer = createHttpServer({ configService, loggerService });
    await testServer.start(() => {});

    // Add a connection
    const socket = new FakeSocket();
    fakeServer.emit('connection', socket);

    expect(socket.setKeepAlive).toHaveBeenCalledWith(true);
    expect(loggerService.debug).toHaveBeenCalledWith('New connection accepted', expect.any(Object));

    // Simulate socket error (should remove from tracking)
    socket.emit('error', new Error('socket error'));
    expect(loggerService.debug).toHaveBeenCalledWith(
      'Socket removed from tracking',
      expect.any(Object),
    );

    // Add another socket and close it
    const socket2 = new FakeSocket();
    fakeServer.emit('connection', socket2);
    socket2.emit('close');
    expect(loggerService.debug).toHaveBeenCalledWith(
      'Socket removed from tracking',
      expect.any(Object),
    );

    // Socket without setKeepAlive method (edge-case coverage)
    const socket3 = new FakeSocket();
    delete socket3.setKeepAlive;
    expect(() => fakeServer.emit('connection', socket3)).not.toThrow();
    expect(loggerService.debug).toHaveBeenCalledWith('New connection accepted', expect.any(Object));

    await testServer.stop();
  });

  it('should force close connections when force=true', async () => {
    const loggerService = createLoggerService('full');
    const configService = createConfigService();

    const fakeServer = new FakeServer();
    http.createServer.mockImplementation(() => fakeServer);

    const testServer = createHttpServer({ configService, loggerService });
    await testServer.start(() => {});

    // Add connections
    const socket1 = new FakeSocket();
    const socket2 = new FakeSocket();
    fakeServer.emit('connection', socket1);
    fakeServer.emit('connection', socket2);

    await testServer.stop({ force: true });

    expect(fakeServer.closeIdleConnections).toHaveBeenCalled();
    expect(fakeServer.closeAllConnections).toHaveBeenCalled();
  });
});
