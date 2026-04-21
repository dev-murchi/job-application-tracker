/**
 * Generic connection manager factory.
 *
 * Wraps any connection adapter that implements the standard adapter protocol:
 *   adapter.connect(url)    -> Promise  — open the connection
 *   adapter.close(force)    -> Promise  — close the connection
 *   adapter.isConnected()   -> boolean
 *   adapter.getStatus()     -> Object   — state snapshot
 *   adapter.getPoolStats()  -> Object|null
 *   adapter.healthPing()    -> Promise<{ success, responseTime, timestamp }>
 *
 * Adding a new store (e.g. Redis) simply means creating a redis adapter that
 * satisfies the same protocol and passing it here.
 *
 * @param {{ adapter: object }} deps
 * @returns {object} Uniform connection manager interface
 */
const createConnectionManager = ({ adapter }) => ({
  connect: (url) => adapter.connect(url),
  closeConnection: (force) => adapter.close(force),
  isConnected: () => adapter.isConnected(),
  getConnectionStatus: () => adapter.getStatus(),
  getPoolStats: () => adapter.getPoolStats(),
  healthPing: () => adapter.healthPing(),
});

module.exports = createConnectionManager;
