const express = require('express');
const { UserUpdateSchema } = require('../../../../../schemas');
const { validateBody } = require('../middlewares');
const { createUserController } = require('../controllers/user');

/**
 * Factory function to create user router with injected dependencies
 * @param {Object} dependencies - User Router dependencies
 * @param {Object} dependencies.userService - User service
 * @returns {express.Router} Configured Express router
 */
const createUserRouter = ({ userService }) => {
  const router = express.Router();
  const userController = createUserController({ userService });
  router.get('/profile', userController.getCurrentUser);
  router.patch('/update', validateBody(UserUpdateSchema), userController.updateUser);

  return router;
};

module.exports = { createUserRouter };
