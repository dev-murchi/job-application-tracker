const express = require('express');
const { UserUpdateSchema } = require('../../../../../../shared/schemas');
const { validateBody } = require('../middlewares');
const { createUserController } = require('../controllers/user');

/**@typedef { import('../../../../../../application/ports/driving/user.service.port').UserServicePort } UserServicePort */

/**
 * Factory function to create user router with injected dependencies
 * @param {Object} dependencies - User Router dependencies
 * @param {UserServicePort} dependencies.userService - User service
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
