const express = require('express');
const userController = require('../controllers/user');
const { UserUpdateSchema } = require('../utils/validation');
const { validateBody } = require('../middleware/validator');

const router = express.Router();
router.get('/profile', userController.getCurrentUser);
router.patch(
  '/update',
  validateBody(UserUpdateSchema),
  userController.updateUser
);

module.exports = router;
