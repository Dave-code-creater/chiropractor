const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const AuthController = require('../controllers/auth.controller');
const UserController = require('../controllers/user.controller');
const PasswordResetController = require('../controllers/password-reset.controller');
const { authenticate, authorize, authenticateForLogout } = require('../middleware/auth.middleware');
const {
  signUpValidator,
  signInValidator,
  patientRegisterValidator,
  refreshTokenValidator
} = require('../validators');

const router = express.Router();

/**
 * ===============================================
 * STANDARDIZED AUTHENTICATION API ROUTES
 * ===============================================
 * 
 * REST Conventions:
 * - Public routes (no auth) first
 * - Authentication routes before protected routes
 * - Clear separation by access level
 * - Consistent validation and middleware patterns
 */

// ===============================================
// PUBLIC ROUTES (No Authentication Required)
// ===============================================

/**
 * Register new doctor/admin user
 * POST /auth/register
 * Body: { email, password, first_name, last_name, role, ... }
 */
router.post('/register',
  signUpValidator,
  asyncHandler(AuthController.register)
);

/**
 * Register new patient
 * POST /auth/register-patient
 * Body: { email, password, first_name, last_name, phone, ... }
 */
router.post('/register-patient',
  patientRegisterValidator,
  asyncHandler(AuthController.registerPatient)
);

/**
 * User login
 * POST /auth/login
 * Body: { email, password }
 * Returns: JWT access token and refresh token in HTTP-only cookies
 */
router.post('/login',
  signInValidator,
  asyncHandler(AuthController.login)
);

/**
 * Refresh access token
 * POST /auth/refresh-token
 * Body: { refresh_token } (optional - also checks cookies)
 * Returns: New access token
 */
router.post('/refresh-token',
  refreshTokenValidator,
  asyncHandler(AuthController.refreshToken)
);

// ===============================================
// PASSWORD RESET ROUTES (Public)
// ===============================================

/**
 * Request password reset
 * POST /auth/forgot-password
 * Body: { email }
 */
router.post('/forgot-password',
  asyncHandler(PasswordResetController.requestPasswordReset)
);

/**
 * Verify password reset token
 * GET /auth/verify-reset-token?token=...
 */
router.get('/verify-reset-token',
  asyncHandler(PasswordResetController.verifyResetToken)
);

/**
 * Reset password with token
 * POST /auth/reset-password
 * Body: { token, new_password }
 */
router.post('/reset-password',
  asyncHandler(PasswordResetController.resetPassword)
);

/**
 * Verify email with token
 * POST /auth/verify-email
 * Body: { token }
 */
router.post('/verify-email',
  asyncHandler(AuthController.verifyEmail)
);

// ===============================================
// AUTHENTICATED ROUTES
// ===============================================

/**
 * Logout user (lenient auth for expired tokens)
 * POST /auth/logout
 * Auth: Any valid or recently expired token
 */
router.post('/logout',
  authenticateForLogout,
  asyncHandler(AuthController.logout)
);

/**
 * Logout from all devices
 * POST /auth/logout-all
 * Auth: Any valid or recently expired token
 */
router.post('/logout-all',
  authenticateForLogout,
  asyncHandler(AuthController.logoutFromAllDevices)
);

/**
 * Verify user account
 * POST /auth/verify-account
 * Body: { verification_code }
 * Auth: Authenticated user
 */
router.post('/verify-account',
  authenticate,
  asyncHandler(AuthController.verifyAccount)
);

// ===============================================
// USER PROFILE ROUTES
// ===============================================

/**
 * Get current user profile
 * GET /auth/profile
 * Auth: Any authenticated user
 */
router.get('/profile',
  authenticate,
  asyncHandler(UserController.getProfile)
);

/**
 * Get current user profile (alias)
 * GET /auth/me
 * Auth: Any authenticated user
 */
router.get('/me',
  authenticate,
  asyncHandler(UserController.getProfile)
);

// ===============================================
// ADMIN-ONLY ROUTES
// ===============================================

/**
 * Get all users
 * GET /auth/users
 * Auth: Admin only
 */
router.get('/users',
  authenticate,
  authorize(['admin']),
  asyncHandler(AuthController.getAllUsers)
);





module.exports = router; 