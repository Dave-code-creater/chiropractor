import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller.js';
import { create, getById, update } from '../controllers/profile.controller.js';

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
 * /profiles:
 *   post:
 *     summary: Create profile
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/profiles', create);

/**
 * @swagger
 * /profiles/{id}:
 *   get:
 *     summary: Get profile by id
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
router.get('/profiles/:id', getById);

/**
 * @swagger
 * /profiles/{id}:
 *   put:
 *     summary: Update profile
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
router.put('/profiles/:id', update);

export default router;
