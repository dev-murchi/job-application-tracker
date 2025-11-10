const express = require('express');
const { userController } = require('../controllers');
const { UserUpdateSchema } = require('../schemas');
const { validateBody } = require('../middleware');

const router = express.Router();
router.get('/profile', userController.getCurrentUser);
router.patch('/update', validateBody(UserUpdateSchema), userController.updateUser);

module.exports = router;
