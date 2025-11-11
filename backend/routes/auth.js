const express = require('express');
const { UserRegisterSchema, UserLoginSchema } = require('../schemas');
const config = require('../config');
const { validateBody, authRouteRateLimit } = require('../middleware');

/**
 * Factory function to create auth router with injected dependencies
 * @param {Object} authController - Auth controller instance
 * @returns {express.Router} Configured Express router
 */
const createAuthRouter = (authController) => {
  const router = express.Router();

  if (config.isProduction) {
    router.use(authRouteRateLimit);
  }

  router.post('/register', validateBody(UserRegisterSchema), authController.register);

  router.post('/login', validateBody(UserLoginSchema), authController.login);

  router.get('/logout', authController.logout);

  return router;
};

module.exports = { createAuthRouter };
