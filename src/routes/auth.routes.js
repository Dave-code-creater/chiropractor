const express = require('express');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('../utils/asyncHandler');
const AuthController = require('../controllers/auth.controller');
const UserController = require('../controllers/user.controller');
const PasswordResetController = require('../controllers/password-reset.controller');
const { authenticate, authorize, authenticateForLogout } = require('../middleware/auth.middleware');
const { signUpValidator, signInValidator, patientRegisterValidator, refreshTokenValidator } = require('../validators');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and authorization endpoints
 */

// Rate limiting for authentication endpoints
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again in 15 minutes',
    statusCode: 429,
    errorCode: '4290'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for successful requests (status < 400)
    return req.res && req.res.statusCode < 400;
  }
});

const passwordResetRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Limit each IP to 3 password reset attempts per hour
  message: {
    success: false,
    message: 'Too many password reset attempts, please try again in 1 hour',
    statusCode: 429,
    errorCode: '4291'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public auth routes

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Authenticate user and get access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Login successful"
 *               data:
 *                 user:
 *                   id: 1
 *                   email: "user@example.com"
 *                   role: "patient"
 *                 accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken: "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4="
 *       400:
 *         description: Invalid credentials or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       429:
 *         description: Too many login attempts
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "Too many login attempts, please try again in 15 minutes"
 *               statusCode: 429
 *               errorCode: "4290"
 */
router.post('/login', authRateLimit, signInValidator, asyncHandler(AuthController.login));
router.post('/register', signUpValidator, asyncHandler(AuthController.registerUser));
router.post('/patient-register', patientRegisterValidator, asyncHandler(UserController.registerPatient));
// router.post('/oauth', asyncHandler(AuthController.oauthLogin)); // Method not implemented
router.post('/refresh-token', refreshTokenValidator, asyncHandler(AuthController.refreshToken));

// Password reset
router.post('/forgot-password', passwordResetRateLimit, asyncHandler(PasswordResetController.forgotPassword));
router.post('/reset-password', passwordResetRateLimit, asyncHandler(PasswordResetController.resetPassword));
router.get('/verify-reset-token', asyncHandler(PasswordResetController.verifyResetToken));

// Protected routes
router.post('/logout', authenticateForLogout, asyncHandler(AuthController.logout));
router.post('/revoke-refresh-token', authenticate, asyncHandler(AuthController.logoutFromAllDevices));

module.exports = router;