import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller.js';
import { send, history } from '../controllers/message.controller.js';

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
router.get('/', healthCheck);

/**
 * @swagger
 * /messages:
 *   post:
 *     summary: Send message
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/messages', send);

/**
 * @swagger
 * /history/{room}:
 *   get:
 *     summary: Get chat history for room
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
router.get('/history/:room', history);

export default router;
