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
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new clinic user
 *     description: Creates a user account for patients, doctors, or admins.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Account created successfully"
 *               data:
 *                 user_id: 42
 *                 email: "doctor@clinic.com"
 *       400:
 *         description: Validation error
 */
router.post('/register', signUpValidator, asyncHandler(AuthController.registerUser));
/**
 * @swagger
 * /auth/patient-register:
 *   post:
 *     summary: Self-register a new patient
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PatientRegisterRequest'
 *     responses:
 *       201:
 *         description: Patient registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 */
router.post('/patient-register', patientRegisterValidator, asyncHandler(UserController.registerPatient));
// router.post('/oauth', asyncHandler(AuthController.oauthLogin)); // Method not implemented
/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh the access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid refresh token
 */
router.post('/refresh-token', refreshTokenValidator, asyncHandler(AuthController.refreshToken));

// Password reset
/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Send password reset email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Reset instructions sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       429:
 *         description: Rate limit exceeded
 */
router.post('/forgot-password', passwordResetRateLimit, asyncHandler(PasswordResetController.forgotPassword));
/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Invalid or expired reset token
 */
router.post('/reset-password', passwordResetRateLimit, asyncHandler(PasswordResetController.resetPassword));
/**
 * @swagger
 * /auth/verify-reset-token:
 *   get:
 *     summary: Verify password reset token
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Token valid
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Token invalid or expired
 */
router.get('/verify-reset-token', asyncHandler(PasswordResetController.verifyResetToken));

// Protected routes
/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout current session
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/logout', authenticateForLogout, asyncHandler(AuthController.logout));
/**
 * @swagger
 * /auth/revoke-refresh-token:
 *   post:
 *     summary: Revoke all refresh tokens for the user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Refresh tokens revoked
 *       401:
 *         description: Unauthorized
 */
router.post('/revoke-refresh-token', authenticate, asyncHandler(AuthController.logoutFromAllDevices));

module.exports = router;
