const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const ReportController = require('../controllers/report.controller.js');
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

/**
 * @swagger
 * /reports/health-conditions:
 *   get:
 *     summary: Get health conditions
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/reports/health-conditions', rbac('doctor', 'patient', 'staff'), ReportController.getHealthConditions);

module.exports = router;
