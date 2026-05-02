const requiredMethods = [
  'connect',
  'close',
  'isConnected',
  'getStatus',
  'getPoolStats',
  'healthPing',
  'getDriverInstance',
];
const dbConnectionManagerContract = {
  validate(instance) {
    for (const method of requiredMethods) {
      if (typeof instance[method] !== 'function') {
        throw new TypeError(`DbConnectionManager adapter must implement '${method}()'`);
      }
    }
  },
};

/**
 * @typedef {Object} ConnectionStatus
 * @property {string}   state       - Human-readable state: `connected` | `connecting` | `disconnecting` | `disconnected` | `uninitialized`.
 * @property {number}   readyState  - Raw Mongoose/driver numeric ready-state value.
 * @property {string}   [host]      - Hostname when available.
 * @property {number}   [port]      - Port when available.
 * @property {string}   [name]      - Database name when available.
 */

/**
 * @typedef {Object} PoolStats
 * @property {number}          [maxPoolSize]        - Configured maximum pool size.
 * @property {number}          [minPoolSize]        - Configured minimum pool size.
 * @property {number|string}   [currentConnections] - Current active connections, or `'N/A'` if unavailable.
 */

/**
 * @typedef {Object} HealthPingResult
 * @property {boolean}  success       - Whether the ping succeeded.
 * @property {number}   responseTime  - Round-trip time in milliseconds.
 * @property {string}   timestamp     - ISO 8601 timestamp of the check.
 * @property {string}   [error]       - Error message when `success` is `false`.
 */

/**
 * Port: DbConnectionManager
 *
 * Driven port — used by the application layer to manage a database connection.
 * Any adapter bound to DB_CONNECTION_MANAGER_PORT must satisfy this interface.
 *
 * @typedef {Object} DbConnectionManagerPort
 * @property {(url: string) => Promise<*>}            connect           - Open the connection using the given database URI.
 * @property {(force?: boolean) => Promise<void>}     close             - Close the connection; `force` immediately drops sockets.
 * @property {() => boolean}                          isConnected       - Returns `true` when the connection is fully established.
 * @property {() => ConnectionStatus}                 getStatus         - Snapshot of current connection state and metadata.
 * @property {() => PoolStats|null}                   getPoolStats      - Pool configuration/metrics, or `null` if unavailable.
 * @property {() => Promise<HealthPingResult>}        healthPing        - Lightweight ping for health-check endpoints.
 * @property {() => *}                                getDriverInstance - Underlying driver connection instance (e.g. `mongoose.Connection`).
 */

module.exports = { dbConnectionManagerContract };
