const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const AuthController = require('../controllers/auth.controller.js');
const PasswordResetController = require('../controllers/password-reset.controller.js');
const asyncHandler = require('../helper/asyncHandler.js');
const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', asyncHandler(HealthController.healthCheck));

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/register', asyncHandler(AuthController.register));

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login and receive JWT
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/login', asyncHandler(AuthController.login));

/**
 * @swagger
 * /refresh:
 *   post:
 *     summary: Refresh JWT token
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/refresh', asyncHandler(AuthController.refresh));

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Logout user
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/logout', asyncHandler(AuthController.logout));

/**
 * @swagger
 * /verify:
 *   post:
 *     summary: Verify JWT token
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/verify', asyncHandler(AuthController.verify));

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Request password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/forgot-password', asyncHandler(PasswordResetController.requestPasswordReset));

/**
 * @swagger
 * /verify-reset-token:
 *   get:
 *     summary: Verify password reset token
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/verify-reset-token', asyncHandler(PasswordResetController.verifyResetToken));

/**
 * @swagger
 * /reset-password:
 *   post:
 *     summary: Reset password with token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.post('/reset-password', asyncHandler(PasswordResetController.resetPassword));

module.exports = router;
