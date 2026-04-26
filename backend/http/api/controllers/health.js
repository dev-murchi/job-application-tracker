const { StatusCodes } = require('http-status-codes');

/**
 * Factory function to create health controller with injected dependencies
 * @param {Object} healthService - Health service for health checks
 * @returns {Object} Health controller methods
 */
const createHealthController = ({ healthService }) => {
  /**
   * Get application health status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  const getHealth = async (req, res) => {
    const healthStatus = await healthService.getHealthStatus();

    // Return 503 Service Unavailable if system is degraded
    // This helps load balancers and monitoring tools detect issues
    const statusCode =
      healthStatus.status === 'ok' ? StatusCodes.OK : StatusCodes.SERVICE_UNAVAILABLE;

    res.status(statusCode).json(healthStatus);
  };

  return {
    getHealth,
  };
};

module.exports = {
  createHealthController,
};
