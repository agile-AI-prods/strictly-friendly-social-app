const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

router.post('/login', authController.login);
router.post('/signup', authController.signup);
router.post('/check-email', authController.checkEmail);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/logout', authController.logout);
router.put('/update-email', authenticateToken, authController.updateEmail);
router.put('/update-password', authenticateToken, authController.updatePassword);

module.exports = router; 