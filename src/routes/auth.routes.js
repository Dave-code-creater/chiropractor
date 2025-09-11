const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const AuthController = require('../controllers/auth.controller');
const UserController = require('../controllers/user.controller');
const PasswordResetController = require('../controllers/password-reset.controller');
const { authenticate, authorize, authenticateForLogout } = require('../middleware/auth.middleware');
const { signUpValidator, signInValidator, patientRegisterValidator, refreshTokenValidator } = require('../validators');

const router = express.Router();

// Public auth routes
router.post('/login', signInValidator, asyncHandler(AuthController.login));
router.post('/register', signUpValidator, asyncHandler(AuthController.registerUser));
router.post('/patient-register', patientRegisterValidator, asyncHandler(UserController.registerPatient));
// router.post('/oauth', asyncHandler(AuthController.oauthLogin)); // Method not implemented
router.post('/refresh-token', refreshTokenValidator, asyncHandler(AuthController.refreshToken));

// Password reset
router.post('/forgot-password', asyncHandler(PasswordResetController.forgotPassword));
router.post('/reset-password', asyncHandler(PasswordResetController.resetPassword));
router.get('/verify-reset-token', asyncHandler(PasswordResetController.verifyResetToken));

// Protected routes
router.post('/logout', authenticateForLogout, asyncHandler(AuthController.logout));
router.post('/revoke-refresh-token', authenticate, asyncHandler(AuthController.logoutFromAllDevices));

module.exports = router;