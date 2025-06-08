import { Router } from 'express';
import HealthController from '../controllers/health.controller.js';
import ReportController from '../controllers/report.controller.js';

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
 * /reports:
 *   post:
 *     summary: Create report
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/reports', ReportController.create);

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
router.get('/reports/:id', ReportController.getById);

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
router.put('/reports/:id', ReportController.update);

/**
 * @swagger
 * /reports:
 *   get:
 *     summary: List reports
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/reports', ReportController.list);

export default router;
