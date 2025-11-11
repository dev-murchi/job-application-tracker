const express = require('express');

/**
 * Factory function to create health router with injected dependencies
 * @param {Object} healthController - Health controller
 * @returns {express.Router} Configured health router
 */
const createHealthRouter = (healthController) => {
  const router = express.Router();

  // GET /health - Get application health status
  router.get('/', healthController.getHealth);

  return router;
};

module.exports = {
  createHealthRouter,
};
