/**@typedef {import('../ports/driven/database/db-connection-manager.port').DbConnectionManagerPort} DbConnectionManagerPort */
/**@typedef {import('../ports/driven/config/config-service.port').ConfigServicePort} ConfigServicePort */
/**@typedef {import('../ports/driving/health.service.port').HealthServicePort} HealthServicePort */

/**
 * Factory function to create health service with injected dependencies
 * @param {Object} dependencies - Dependency object
 * @param {DbConnectionManagerPort} dependencies.dbConnectionManager - Database connection manager for health checks
 * @param {ConfigServicePort} dependencies.configService - Configuration service
 * @returns {HealthServicePort} Health service methods
 */
const createHealthService = ({ dbConnectionManager, configService }) => {
  const isProduction = configService.get('isProduction');
  const nodeEnv = configService.get('nodeEnv');

  const getHealthStatus = async () => {
    let dbStatus;
    let dbPing;
    let isConnected = false;

    try {
      dbStatus = dbConnectionManager.getStatus();
      isConnected = dbConnectionManager.isConnected();
      dbPing = await dbConnectionManager.healthPing();
    } catch (_error) {
      // If health check fails, return degraded status
      dbStatus = { state: 'error', readyState: -1 };
      dbPing = { success: false, error: 'Health check failed' };
    }

    // Determine overall health status
    const overallStatus = isConnected && dbPing.success ? 'ok' : 'degraded';

    // Build database info - hide sensitive details in production
    const databaseInfo = {
      status: dbStatus.state,
      connected: isConnected,
      ping: {
        success: dbPing.success,
        responseTime: dbPing.responseTime || null,
      },
    };

    // Only include connection details in non-production environments
    if (!isProduction) {
      databaseInfo.host = dbStatus.host;
      databaseInfo.port = dbStatus.port;
      databaseInfo.name = dbStatus.name;
      databaseInfo.readyState = dbStatus.readyState;
    }

    const response = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      database: databaseInfo,
    };

    // Only include detailed application info in non-production
    if (!isProduction) {
      response.application = {
        name: 'job-tracker-api',
        version: process.env.npm_package_version || '1.0.0',
        nodeVersion: process.version,
        environment: nodeEnv,
        pid: process.pid,
      };
    }

    return response;
  };

  return {
    getHealthStatus,
  };
};

module.exports = {
  createHealthService,
};
