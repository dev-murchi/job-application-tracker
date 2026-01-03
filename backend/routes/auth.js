const express = require('express');
const { UserRegisterSchema, UserLoginSchema } = require('../schemas');
const { validateBody, createRateLimiters } = require('../middleware');

/**
 * Factory function to create auth router with injected dependencies
 * @param {Object} dependencies - Dependency object
 * @param {Object} dependencies.authController - Auth controller instance
 * @param {Object} dependencies.configService - Configuration service
 * @returns {express.Router} Configured Express router
 */
const createAuthRouter = ({ authController, configService }) => {
  const router = express.Router();
  const { authRouteRateLimit } = createRateLimiters({ configService });

  if (configService.get('isProduction')) {
    router.use(authRouteRateLimit);
  }

  router.post('/register', validateBody(UserRegisterSchema), authController.register);

  router.post('/login', validateBody(UserLoginSchema), authController.login);

  router.get('/logout', authController.logout);

  return router;
};

module.exports = { createAuthRouter };
