const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const AuthController = require('../controllers/auth.controller.js');
const { asyncHandler } = require('../helper/asyncHandler.js');
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
router.post('/login', AuthController.login);

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

module.exports = router;
