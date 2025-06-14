const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const MessageController = require('../controllers/message.controller.js');
const jwtMiddleware = require('../middlewares/jwt.middleware.js');
const { rbac } = require('../middlewares/rbac.middleware.js');

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
router.get('/', HealthController.healthCheck);
router.use(jwtMiddleware);
router.use(rbac);

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send message
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/messages', MessageController.send);

/**
 * @swagger
 * /chat/history/{room}:
 *   get:
 *     summary: Chat history
 *     parameters:
 *       - in: path
 *         name: room
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/chat/history/:room', MessageController.history);

/**
 * @swagger
 * /messages/user/{id}:
 *   get:
 *     summary: Get user messages
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/messages/user/:id', MessageController.historyByUser);

/**
 * @swagger
 * /messages/inbox:
 *   get:
 *     summary: Get inbox list
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/messages/inbox', MessageController.inbox);

module.exports = router;
