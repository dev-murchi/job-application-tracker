const express = require('express');
const { UserUpdateSchema } = require('../schemas');
const { validateBody } = require('../middleware');

/**
 * Factory function to create user router with injected dependencies
 * @param {Object} userController - User controller instance
 * @returns {express.Router} Configured Express router
 */
const createUserRouter = (userController) => {
  const router = express.Router();
  router.get('/profile', userController.getCurrentUser);
  router.patch('/update', validateBody(UserUpdateSchema), userController.updateUser);

  return router;
};

module.exports = { createUserRouter };
