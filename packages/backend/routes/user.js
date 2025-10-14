const express = require('express');
const userController = require('../controllers/user');
const { validateData, UserUpdateSchema } = require('../middleware/validation');

const router = express.Router();
router.get('/profile', userController.getCurrentUser);
router.patch('/update', (req, res, next) => {
  req.body = validateData(UserUpdateSchema, req.body);
  next();
}, userController.updateUser);

module.exports = router;
