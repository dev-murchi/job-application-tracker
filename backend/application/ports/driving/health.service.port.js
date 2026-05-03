const requiredMethods = ['getHealthStatus'];

const healthServiceContract = {
  validate(instance) {
    requiredMethods.forEach((method) => {
      if (typeof instance[method] !== 'function') {
        throw new TypeError(`HealthService adapter must implement '${method}()'`);
      }
    });
  },
};

/**
 * @typedef {import("../driven/database/db-connection-manager.port").ConnectionStatus} DbConnectionStatus
 * @typedef {import("../driven/database/db-connection-manager.port").HealthPingResult} DbHealthPingResult
 */

/**
 * @typedef {Object} DatabaseHealth
 * @property {DbConnectionStatus} status - database connection status
 * @property {boolean} connected - whether the database is connected
 * @property {DbHealthPingResult} ping - result of database ping
 */

/**
 * @typedef {Object} HealthStatus
 * @property {"ok" | "degraded"} status - overall service status
 * @property {string} timestamp - ISO timestamp of health check
 * @property {number} uptime - service uptime in milliseconds
 * @property {DatabaseHealth} database - database health details
 */

/**
 * @typedef {Object} HealthServicePort
 * @property {() => Promise<HealthStatus>} getHealthStatus - fetch current health status
 */

module.exports = { healthServiceContract };
