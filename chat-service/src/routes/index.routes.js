import { Router } from 'express';
import HealthController from '../controllers/health.controller.js';
import MessageController from '../controllers/message.controller.js';

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

export default router;
