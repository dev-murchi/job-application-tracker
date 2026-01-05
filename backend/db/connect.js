const mongoose = require('mongoose');
const {
  POOL_MAX_PROD,
  POOL_MAX_DEV,
  POOL_MIN_PROD,
  POOL_MIN_DEV,
  MAX_IDLE_TIME_MS,
  WAIT_QUEUE_TIMEOUT_MS,
  SERVER_SELECTION_TIMEOUT_MS,
  SOCKET_TIMEOUT_MS,
  CONNECT_TIMEOUT_MS,
  HEARTBEAT_FREQUENCY_MS,
  WRITE_CONCERN_W,
  WRITE_CONCERN_J,
  WRITE_CONCERN_WTIMEOUT_MS,
  READ_CONCERN_LEVEL,
  READ_PREFERENCE,
  COMPRESSORS,
  ZLIB_COMPRESSION_LEVEL,
  MONITOR_COMMANDS_IN_DEV,
  READY_STATE_DISCONNECTED,
  READY_STATE_CONNECTED,
  READY_STATE_CONNECTING,
  READY_STATE_DISCONNECTING,
  READY_STATE_UNINITIALIZED,
} = require('../constants');

const createConnectionOptions = (isProduction) => ({
  // Connection pool settings
  maxPoolSize: isProduction ? POOL_MAX_PROD : POOL_MAX_DEV,
  minPoolSize: isProduction ? POOL_MIN_PROD : POOL_MIN_DEV,
  maxIdleTimeMS: MAX_IDLE_TIME_MS,
  waitQueueTimeoutMS: WAIT_QUEUE_TIMEOUT_MS,

  // Server selection and socket timeouts
  serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS,
  socketTimeoutMS: SOCKET_TIMEOUT_MS,
  connectTimeoutMS: CONNECT_TIMEOUT_MS,

  // Heartbeat and monitoring
  heartbeatFrequencyMS: HEARTBEAT_FREQUENCY_MS,

  // Retry and durability settings
  writeConcern: {
    w: WRITE_CONCERN_W,
    j: WRITE_CONCERN_J,
    wtimeout: WRITE_CONCERN_WTIMEOUT_MS,
  },
  readConcern: {
    level: READ_CONCERN_LEVEL,
  },
  readPreference: READ_PREFERENCE,

  // Network compression
  compressors: COMPRESSORS,
  zlibCompressionLevel: ZLIB_COMPRESSION_LEVEL,

  // Connection monitoring
  monitorCommands: isProduction ? !MONITOR_COMMANDS_IN_DEV : MONITOR_COMMANDS_IN_DEV,

  // Application name for MongoDB logs
  appName: 'job-tracker-api',
});

/**
 * Create event handlers for MongoDB connection lifecycle events
 * @param {mongoose.Connection} connection - Mongoose connection instance
 * @param {Object} loggerService - Logger service instance
 * @param {boolean} isProduction - Whether running in production mode
 * @returns {Object} Object containing all event handler functions
 */
const createEventHandlers = (connection, loggerService, isProduction) => ({
  onConnected: () => {
    const meta = isProduction
      ? { readyState: connection.readyState }
      : {
          host: connection.host,
          port: connection.port,
          database: connection.name,
          readyState: connection.readyState,
        };

    loggerService.info('MongoDB connected successfully', meta);
  },

  onError: (err) => {
    loggerService.error('MongoDB connection error', {
      error: err.message,
      code: err.code,
      stack: isProduction ? undefined : err.stack,
    });
  },

  onDisconnected: () => {
    loggerService.warn('MongoDB disconnected', {
      readyState: connection.readyState,
    });
  },

  onReconnected: () => {
    const meta = isProduction
      ? { readyState: connection.readyState }
      : { host: connection.host, readyState: connection.readyState };

    loggerService.info('MongoDB reconnected', meta);
  },

  onClose: () => {
    loggerService.info('MongoDB connection closed');
  },

  onFullSetup: () => {
    loggerService.info('MongoDB replica set fully set up');
  },

  onAll: () => {
    loggerService.info('MongoDB connected to all servers in replica set');
  },
});

const registerEventListeners = (connection, handlers) => {
  connection.on('connected', handlers.onConnected);
  connection.on('error', handlers.onError);
  connection.on('disconnected', handlers.onDisconnected);
  connection.on('reconnected', handlers.onReconnected);
  connection.on('close', handlers.onClose);
  connection.on('fullsetup', handlers.onFullSetup);
  connection.on('all', handlers.onAll);
};

const validateConnectionUrl = (url) => {
  if (!url || typeof url !== 'string') {
    throw new Error(
      'MongoDB connection URL is missing or invalid. Please provide the connection URL.',
    );
  }
  return url;
};

/**
 * Create a connection manager for MongoDB with lifecycle management
 * @param {Object} options - Connection manager options
 * @param {mongoose.Connection} [options.connection] - Existing mongoose connection
 * @param {Object} options.config - Configuration object
 * @param {boolean} options.config.isProduction - Whether running in production mode
 * @param {Object} options.loggerService - Logger service instance for connection logging
 * @returns {Object} Connection manager with connect and closeConnection methods
 */
const createConnectionManager = ({ connection, config, loggerService }) => {
  const conn = connection || mongoose.connection;

  const options = createConnectionOptions(config.isProduction);
  const eventHandlers = createEventHandlers(conn, loggerService, config.isProduction);

  const connect = (url) => {
    validateConnectionUrl(url);
    registerEventListeners(conn, eventHandlers);

    if (conn === mongoose.connection) {
      return mongoose.connect(url, options);
    } else {
      return conn.openUri(url, options);
    }
  };

  const closeConnection = async (force = false) => {
    try {
      loggerService.info('Closing MongoDB connection...', { force });
      await conn.close(force);
      loggerService.info('MongoDB connection closed successfully');
    } catch (error) {
      loggerService.error('Error closing MongoDB connection', {
        error: error.message,
        stack: config.isProduction ? undefined : error.stack,
      });
      throw error;
    }
  };

  const isConnected = () => conn.readyState === READY_STATE_CONNECTED;

  const mapConnectionState = (readyState) => {
    const states = {
      [READY_STATE_DISCONNECTED]: 'disconnected',
      [READY_STATE_CONNECTED]: 'connected',
      [READY_STATE_CONNECTING]: 'connecting',
      [READY_STATE_DISCONNECTING]: 'disconnecting',
      [READY_STATE_UNINITIALIZED]: 'uninitialized',
    };
    return states[readyState] || 'unknown';
  };

  const getConnectionStatus = () => ({
    state: mapConnectionState(conn.readyState),
    readyState: conn.readyState,
    host: conn.host,
    port: conn.port,
    name: conn.name,
  });

  const getPoolStats = () => {
    if (!conn.db) {
      return null;
    }

    try {
      return {
        maxPoolSize: conn.options?.maxPoolSize,
        minPoolSize: conn.options?.minPoolSize,
        currentConnections: 'N/A',
      };
    } catch (error) {
      loggerService.error('Error getting pool stats', { error: error.message });
      return null;
    }
  };

  const healthPing = async () => {
    const startTime = Date.now();
    const responseTime = () => Date.now() - startTime;
    const timestamp = () => new Date().toISOString();

    try {
      await conn.db.admin().ping();
      return {
        success: true,
        responseTime: responseTime(),
        timestamp: timestamp(),
      };
    } catch (error) {
      return {
        success: false,
        responseTime: responseTime(),
        error: error.message,
        timestamp: timestamp(),
      };
    }
  };

  return {
    connect,
    closeConnection,
    isConnected,
    getConnectionStatus,
    getPoolStats,
    healthPing,
  };
};

module.exports = createConnectionManager;
