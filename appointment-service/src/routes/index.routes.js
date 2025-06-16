const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const AppointmentController = require('../controllers/appointment.controller.js');
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
 * /appointments:
 *   post:
 *     summary: Create appointment
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/appointments', AppointmentController.create);

/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Get appointment
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
router.get('/appointments/:id', AppointmentController.getById);

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
router.put('/appointments/:id', AppointmentController.update);

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: List appointments
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/appointments', rbac('doctor', 'user'), AppointmentController.list);

module.exports = router;
