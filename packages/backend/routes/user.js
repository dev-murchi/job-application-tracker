const express = require('express');
const userController = require('../controllers/user');
const authenticateUser = require('../middleware/auth');

const router = express.Router();
router.get('/profile', userController.getCurrentUser);
router.patch('/update', userController.updateUser);

module.exports = router;
