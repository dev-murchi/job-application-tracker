const express = require('express');
const userController = require('../controllers/user.js');
const authenticateUser = require('../middleware/auth.js');

const router = express.Router();
router.get('/profile', authenticateUser, userController.getCurrentUser);
router.patch('/update', authenticateUser, userController.updateUser);

module.exports = router;