const express = require('express');
const AppointmentController = require('../controllers/appointment.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize, authorizeAppointmentAccess, authorizePatientAppointments } = require('../middleware/auth.middleware');

const router = express.Router();
const patientAppointmentsRouter = express.Router({ mergeParams: true });

const mapNestedAppointmentId = (req, _res, next) => {
  if (!req.params.id && req.params.appointment_id) {
    req.params.id = req.params.appointment_id;
  }

  if (!req.params.patientId && req.params.patient_id) {
    req.params.patientId = req.params.patient_id;
  }

  next();
};

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Appointment management endpoints for scheduling, updating, and tracking medical appointments
 */

// Public routes

/**
 * @swagger
 * /appointments/doctors:
 *   get:
 *     summary: List available doctors
 *     description: Retrieve doctors who can be booked for appointments along with their specialties and availability status.
 *     tags: [Appointments]
 *     responses:
 *       200:
 *         description: Doctor list retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Doctors retrieved successfully"
 *               data:
 *                 doctors:
 *                   - id: 1
 *                     first_name: "Sarah"
 *                     last_name: "Smith"
 *                     specialization: "Chiropractic Medicine"
 *                     is_available: true
 *                     upcoming_slots:
 *                       - "2025-06-26T15:00:00Z"
 *                       - "2025-06-27T09:30:00Z"
 */
router.get('/doctors', asyncHandler(AppointmentController.getAllDoctors));

/**
 * @swagger
 * /appointments/doctors/{doctor_id}/availability:
 *   get:
 *     summary: Get doctor availability
 *     description: Retrieve a doctor's working hours and remaining availability for a given day.
 *     tags: [Appointments]
 *     parameters:
 *       - in: path
 *         name: doctor_id
 *         required: true
 *         description: Doctor identifier
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: date
 *         required: false
 *         description: ISO date to check availability for (defaults to doctor's schedule overview if omitted)
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Availability retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Doctor availability retrieved successfully"
 *               data:
 *                 doctor_id: 12
 *                 date: "2025-06-26"
 *                 workingHours:
 *                   start: "09:00"
 *                   end: "17:00"
 *                 available_slots:
 *                   - "09:30"
 *                   - "11:00"
 *                   - "15:30"
 *       404:
 *         description: Doctor not found
 */
router.get('/doctors/:doctor_id/availability', asyncHandler(AppointmentController.getDoctorAvailability));

// Authenticated routes

/**
 * @swagger
 * /appointments:
 *   post:
 *     summary: Create a new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateAppointmentRequest'
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Appointment booked successfully! You will receive a confirmation email shortly."
 *               data:
 *                 appointment:
 *                   id: 1
 *                   appointment_datetime: "2025-06-26T11:30:00Z"
 *                   status: "scheduled"
 *                   patient:
 *                     id: 1
 *                     first_name: "John"
 *                     last_name: "Doe"
 *                   doctor:
 *                     id: 1
 *                     first_name: "Dr. Sarah"
 *                     last_name: "Smith"
 *       400:
 *         description: Bad request (validation error, scheduling conflict, etc.)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *   get:
 *     summary: Get all appointments (admin/staff/doctor view)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, confirmed, in-progress, completed, cancelled, no-show]
 *         description: Filter by appointment status
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: integer
 *         description: Filter by doctor ID
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: integer
 *         description: Filter by patient ID
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.post('/', authenticate, authorize('doctor', 'admin', 'staff', 'patient'), asyncHandler(AppointmentController.createAppointment));
/**
 * @swagger
 * /appointments/check-availability:
 *   post:
 *     summary: Check if an appointment slot is available
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [doctor_id, date, time]
 *             properties:
 *               doctor_id:
 *                 type: integer
 *                 description: Doctor identifier
 *                 example: 12
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Desired appointment date in ISO format
 *                 example: "2025-06-26"
 *               time:
 *                 type: string
 *                 description: Desired appointment start time (24h or locale format)
 *                 example: "11:30"
 *     responses:
 *       200:
 *         description: Availability check completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Availability checked successfully"
 *               data:
 *                 doctor_id: 12
 *                 requested_slot:
 *                   date: "2025-06-26"
 *                   time: "11:30"
 *                   duration_minutes: 30
 *                 is_available: false
 *                 conflicts:
 *                   - appointment_id: 45
 *                     scheduled_for: "2025-06-26T11:30:00Z"
 *                 alternative_slots:
 *                   - "10:30"
 *                   - "13:30"
 *       400:
 *         description: Invalid request payload
 */
router.post('/check-availability', authenticate, asyncHandler(AppointmentController.checkAvailability));
/**
 * @swagger
 * /appointments/me:
 *   get:
 *     summary: Get authenticated patient's appointments
 *     description: Returns upcoming and past appointments for the signed-in patient with pagination support.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, confirmed, in-progress, completed, cancelled, no-show]
 *     responses:
 *       200:
 *         description: Patient appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 *       401:
 *         description: Unauthorized
 */
router.get('/me', authenticate, authorize('patient'), asyncHandler(AppointmentController.getMyAppointments));
/**
 * @swagger
 * /appointments/patient/{patient_id}:
 *   get:
 *     summary: Get appointments for a patient by ID
 *     description: Accessible to staff, doctors, admins, and the patient themselves when authorized.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, confirmed, in-progress, completed, cancelled, no-show]
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get(
  '/patient/:patient_id',
  authenticate,
  authorize('doctor', 'admin', 'staff', 'patient'),
  authorizePatientAppointments,
  asyncHandler(AppointmentController.getPatientAppointments)
);
/**
 * @swagger
 * /appointments/stats:
 *   get:
 *     summary: Get appointment statistics
 *     description: Provides aggregated appointment metrics (upcoming, completed, cancellations) for dashboards.
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: range
 *         required: false
 *         description: Date range filter (e.g. last_7_days, last_30_days)
 *         schema:
 *           type: string
 *       - in: query
 *         name: doctor_id
 *         required: false
 *         description: Filter stats for a specific doctor
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Appointment statistics retrieved successfully"
 *               data:
 *                 totals:
 *                   upcoming: 12
 *                   completed: 84
 *                   cancelled: 3
 *                 generated_at: "2025-06-01T09:00:00Z"
 *       403:
 *         description: Forbidden
 */
router.get('/stats', authenticate, authorize('doctor', 'admin', 'staff'), asyncHandler(AppointmentController.getAppointmentStats));
router.get('/', authenticate, authorize('doctor', 'admin', 'staff'), asyncHandler(AppointmentController.getAllAppointments));
/**
 * @swagger
 * /appointments/{id}:
 *   get:
 *     summary: Get appointment by ID
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Appointment identifier
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Appointment details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Appointment not found
 *   put:
 *     summary: Update appointment details
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appointment_date:
 *                 type: string
 *                 example: "2025-06-27"
 *               appointment_time:
 *                 type: string
 *                 example: "14:00"
 *               status:
 *                 type: string
 *                 enum: [scheduled, confirmed, in-progress, completed, cancelled, no-show]
 *               location:
 *                 type: string
 *               reason_for_visit:
 *                 type: string
 *               additional_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Appointment not found
 *   delete:
 *     summary: Cancel appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 *       404:
 *         description: Appointment not found
 */
router.get('/:id', authenticate, authorizeAppointmentAccess, asyncHandler(AppointmentController.getAppointmentById));
router.put('/:id', authenticate, authorizeAppointmentAccess, asyncHandler(AppointmentController.updateAppointment));
/**
 * @swagger
 * /appointments/{id}/reschedule:
 *   put:
 *     summary: Reschedule an appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [new_date, new_time]
 *             properties:
 *               new_date:
 *                 type: string
 *                 format: date
 *                 example: "2025-07-01"
 *               new_time:
 *                 type: string
 *                 example: "10:30"
 *               reason:
 *                 type: string
 *                 example: "Patient requested a later time"
 *     responses:
 *       200:
 *         description: Appointment rescheduled successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Appointment not found
 */
router.put('/:id/reschedule', authenticate, authorizeAppointmentAccess, asyncHandler(AppointmentController.rescheduleAppointment));
router.delete('/:id', authenticate, authorizeAppointmentAccess, asyncHandler(AppointmentController.cancelAppointment));

router.use(
  '/patients/:patient_id/appointments',
  authenticate,
  authorize('doctor', 'admin', 'staff', 'patient'),
  mapNestedAppointmentId,
  authorizePatientAppointments,
  patientAppointmentsRouter
);

/**
 * @swagger
 * /appointments/patients/{patient_id}/appointments:
 *   get:
 *     summary: List appointments for a specific patient (nested route)
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, confirmed, in-progress, completed, cancelled, no-show]
 *     responses:
 *       200:
 *         description: Nested appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
patientAppointmentsRouter.get('/', asyncHandler(AppointmentController.getPatientAppointments));

/**
 * @swagger
 * /appointments/patients/{patient_id}/appointments/{appointment_id}:
 *   get:
 *     summary: Get nested appointment details
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: appointment_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Appointment details retrieved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Appointment not found
 *   put:
 *     summary: Update nested appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: appointment_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               appointment_date:
 *                 type: string
 *               appointment_time:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [scheduled, confirmed, in-progress, completed, cancelled, no-show]
 *               location:
 *                 type: string
 *               reason_for_visit:
 *                 type: string
 *               additional_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment updated successfully
 *   delete:
 *     summary: Cancel nested appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: appointment_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 */
patientAppointmentsRouter.get(
  '/:appointment_id',
  mapNestedAppointmentId,
  authorizeAppointmentAccess,
  asyncHandler(AppointmentController.getAppointmentById)
);
patientAppointmentsRouter.put(
  '/:appointment_id',
  mapNestedAppointmentId,
  authorizeAppointmentAccess,
  asyncHandler(AppointmentController.updateAppointment)
);

/**
 * @swagger
 * /appointments/patients/{patient_id}/appointments/{appointment_id}/reschedule:
 *   put:
 *     summary: Reschedule nested appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: patient_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: appointment_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [new_date, new_time]
 *             properties:
 *               new_date:
 *                 type: string
 *                 example: "2025-07-02"
 *               new_time:
 *                 type: string
 *                 example: "09:45"
 *               reason:
 *                 type: string
 *                 example: "Doctor requested schedule adjustment"
 *     responses:
 *       200:
 *         description: Appointment rescheduled successfully
 */
patientAppointmentsRouter.put(
  '/:appointment_id/reschedule',
  mapNestedAppointmentId,
  authorizeAppointmentAccess,
  asyncHandler(AppointmentController.rescheduleAppointment)
);
patientAppointmentsRouter.delete(
  '/:appointment_id',
  mapNestedAppointmentId,
  authorizeAppointmentAccess,
  asyncHandler(AppointmentController.cancelAppointment)
);

module.exports = router;
