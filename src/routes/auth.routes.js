const express = require('express');
const AuthController = require('../controllers/auth.controller');
const PasswordResetController = require('../controllers/password-reset.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Authentication routes
router.post('/register', asyncHandler(AuthController.register));
router.post('/login', asyncHandler(AuthController.login));
router.post('/refresh', asyncHandler(AuthController.refresh));
router.post('/logout', asyncHandler(AuthController.logout));
router.post('/verify', asyncHandler(AuthController.verify));

// Test endpoint (remove in production)
router.get('/test-registration', asyncHandler(AuthController.testRegistration));

// Password reset routes
router.post('/forgot-password', asyncHandler(PasswordResetController.requestPasswordReset));
router.get('/verify-reset-token', asyncHandler(PasswordResetController.verifyResetToken));
router.post('/reset-password', asyncHandler(PasswordResetController.resetPassword));

module.exports = router; 