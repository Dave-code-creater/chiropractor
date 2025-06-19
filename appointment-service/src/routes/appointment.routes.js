const { Router } = require('express');
const AppointmentController = require('../controllers/appointment.controller.js');
const jwtMiddleware = require('../middlewares/jwt.middleware.js');
const { rbac } = require('../middlewares/rbac.middleware.js');

const router = Router();

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
router.post('/', AppointmentController.create);

/**
 * @swagger
 * /appointments/{id}/profile:
 *   get:
 *     summary: Get patient profile
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
router.get('/:id/profile', AppointmentController.patientProfile);
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
router.get('/:id', AppointmentController.getById);

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
router.put('/:id', AppointmentController.update);

/**
 * @swagger
 * /appointments/{id}/profile:
 *   get:
 *     summary: Get patient profile
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
router.delete('/:id', AppointmentController.delete);

/**
 * @swagger
 * /appointments:
 *   get:
 *     summary: List appointments
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', rbac('doctor', 'user'), AppointmentController.list);

module.exports = router;
