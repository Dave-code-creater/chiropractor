import { Router } from 'express';
import { healthCheck } from '../controllers/health.controller.js';
import { create, getById, update, list } from '../controllers/report.controller.js';

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
 * /reports:
 *   post:
 *     summary: Create report
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/reports', create);

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: List reports
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/reports', list);

/**
 * @swagger
 * /reports/{id}:
 *   get:
 *     summary: Get report by id
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
router.get('/reports/:id', getById);

/**
 * @swagger
 * /reports/{id}:
 *   put:
 *     summary: Update report
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
router.put('/reports/:id', update);

export default router;
