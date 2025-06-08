import { Router } from 'express';
import HealthController from '../controllers/health.controller.js';
import AppointmentController from '../controllers/appointment.controller.js';
import TreatmentNoteController from '../controllers/note.controller.js';

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
router.get('/appointments', AppointmentController.list);

router.post('/treatment-notes', TreatmentNoteController.create);
router.get('/treatment-notes/:id', TreatmentNoteController.getById);
router.put('/treatment-notes/:id', TreatmentNoteController.update);

export default router;
