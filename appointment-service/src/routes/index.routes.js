import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller.js';
import { create, getById, update, list } from '../controllers/appointment.controller.js';

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
 * /appointments:
 *   post:
 *     summary: Create appointment
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/appointments', create);

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: List appointments
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/appointments', list);

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Get appointment by id
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
router.get('/appointments/:id', getById);

/**
 * @swagger
 * /appointments/{id}:
 *   put:
 *     summary: Update appointment
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
router.put('/appointments/:id', update);

export default router;
