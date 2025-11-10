const mongoose = require('mongoose');
const { logger } = require('../utils');

// Constants for configuration (avoid magic numbers)
const POOL_MAX_PROD = 50;
const POOL_MAX_DEV = 10;
const POOL_MIN_PROD = 5;
const POOL_MIN_DEV = 2;

const MAX_IDLE_TIME_MS = 30_000;
const WAIT_QUEUE_TIMEOUT_MS = 5_000;

const SERVER_SELECTION_TIMEOUT_MS = 5_000;
const SOCKET_TIMEOUT_MS = 45_000;
const CONNECT_TIMEOUT_MS = 10_000;

const HEARTBEAT_FREQUENCY_MS = 10_000;

const WRITE_CONCERN_W = 'majority';
const WRITE_CONCERN_J = true;
const WRITE_CONCERN_WTIMEOUT_MS = 5_000;

const READ_CONCERN_LEVEL = 'majority';
const READ_PREFERENCE = 'secondaryPreferred';

const COMPRESSORS = ['zlib'];
const ZLIB_COMPRESSION_LEVEL = 6;

const MONITOR_COMMANDS_IN_DEV = true; // monitorCommands should be enabled in non-prod

// Ready state codes
const READY_STATE_DISCONNECTED = 0;
const READY_STATE_CONNECTED = 1;
const READY_STATE_CONNECTING = 2;
const READY_STATE_DISCONNECTING = 3;
const READY_STATE_UNINITIALIZED = 99;

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

const createEventHandlers = (connection, isProduction) => ({
  onConnected: () => {
    logger.info('MongoDB connected successfully', {
      host: connection.host,
      port: connection.port,
      database: connection.name,
      readyState: connection.readyState,
    });
  },

  onError: (err) => {
    logger.error('MongoDB connection error', {
      error: err.message,
      code: err.code,
      stack: isProduction ? undefined : err.stack,
    });
  },

  onDisconnected: () => {
    logger.warn('MongoDB disconnected', {
      readyState: connection.readyState,
    });
  },

  onReconnected: () => {
    logger.info('MongoDB reconnected', {
      host: connection.host,
      readyState: connection.readyState,
    });
  },

  onClose: () => {
    logger.info('MongoDB connection closed');
  },

  onFullSetup: () => {
    logger.info('MongoDB replica set fully set up');
  },

  onAll: () => {
    logger.info('MongoDB connected to all servers in replica set');
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

const createConnectionManager = ({ connection, config }) => {
  const conn = connection || mongoose.connection;

  const options = createConnectionOptions(config.isProduction);
  const eventHandlers = createEventHandlers(conn, config.isProduction);

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
      logger.info('Closing MongoDB connection...', { force });
      await conn.close(force);
      logger.info('MongoDB connection closed successfully');
    } catch (error) {
      logger.error('Error closing MongoDB connection', {
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
      logger.error('Error getting pool stats', { error: error.message });
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
