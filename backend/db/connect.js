const mongoose = require('mongoose');
const logger = require('../utils/logger');

const createConnectionOptions = (isProduction) => ({
  // Connection pool settings
  maxPoolSize: isProduction ? 50 : 10,
  minPoolSize: isProduction ? 5 : 2,
  maxIdleTimeMS: 30000,
  waitQueueTimeoutMS: 5000,

  // Server selection and socket timeouts
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 10000,

  // Heartbeat and monitoring
  heartbeatFrequencyMS: 10000,

  // Retry and durability settings
  writeConcern: {
    w: 'majority',
    j: true,
    wtimeout: 5000,
  },
  readConcern: {
    level: 'majority',
  },
  readPreference: 'secondaryPreferred',

  // Network compression
  compressors: ['zlib'],
  zlibCompressionLevel: 6,

  // Connection monitoring
  monitorCommands: !isProduction,

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
      'MongoDB connection URL is missing or invalid. Please provide the connection URL.'
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

  const isConnected = () => conn.readyState === 1;

  const mapConnectionState = (readyState) => {
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
      99: 'uninitialized',
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
