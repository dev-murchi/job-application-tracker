const express = require('express');
const { createHealthController } = require('../controllers/health');

/**@typedef {import('../../../../../../../application/ports/driving/health.service.port').HealthServicePort} HealthServicePort*/

/**
 * Factory function to create health router with injected dependencies
 * @param {Object} dependencies - Health Router dependencies
 * @param {HealthServicePort} dependencies.healthService - Health service
 * @returns {express.Router} Configured health router
 */
const createHealthRouter = ({ healthService }) => {
  const router = express.Router();
  const healthController = createHealthController({ healthService });

  // GET /health - Get application health status
  router.get('/', healthController.getHealth);

  return router;
};

module.exports = {
  createHealthRouter,
};
