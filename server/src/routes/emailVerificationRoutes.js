const express = require('express');
const router = express.Router();
const emailVerificationController = require('../controllers/emailVerificationController');

// Verify email with token (GET request from email link)
router.get('/verify', emailVerificationController.verifyEmail);

// Resend verification email (POST request)
router.post('/resend', emailVerificationController.resendVerificationEmail);

module.exports = router;
