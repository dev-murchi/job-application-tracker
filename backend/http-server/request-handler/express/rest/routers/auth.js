const express = require('express');
const { UserRegisterSchema, UserLoginSchema } = require('../../../../../schemas');
const { validateBody, createRateLimiters } = require('../middlewares');
const { createAuthController } = require('../controllers/auth');

/**
 * Factory function to create auth router with injected dependencies
 * @param {Object} dependencies - Dependency object
 * @param {Object} dependencies.authService - Auth service instance
 * @param {Object} dependencies.configService - Configuration service
 * @returns {express.Router} Configured Express router
 */
const createAuthRouter = ({ authService, configService }) => {
  const router = express.Router();
  const authController = createAuthController({ authService, configService });

  if (configService.get('isProduction')) {
    const { authRouteRateLimit } = createRateLimiters({ configService });
    router.use(authRouteRateLimit);
  }

  router.post('/register', validateBody(UserRegisterSchema), authController.register);

  router.post('/login', validateBody(UserLoginSchema), authController.login);

  router.get('/logout', authController.logout);

  return router;
};

module.exports = { createAuthRouter };
