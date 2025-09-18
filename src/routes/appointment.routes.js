const express = require('express');
const AppointmentController = require('../controllers/appointment.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize, authorizeAppointmentAccess, authorizePatientAppointments } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Appointment management endpoints for scheduling, updating, and tracking medical appointments
 */

// Public routes
router.get('/doctors', asyncHandler(AppointmentController.getAllDoctors));
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
router.post('/check-availability', authenticate, asyncHandler(AppointmentController.checkAvailability));
router.get('/me', authenticate, authorize('patient'), asyncHandler(AppointmentController.getMyAppointments));
router.get('/patient/:patient_id', authenticate, authorize('doctor', 'admin', 'staff'), asyncHandler(AppointmentController.getPatientAppointments));
router.get('/stats', authenticate, authorize('doctor', 'admin', 'staff'), asyncHandler(AppointmentController.getAppointmentStats));
router.get('/', authenticate, authorize('doctor', 'admin', 'staff'), asyncHandler(AppointmentController.getAllAppointments));
router.get('/:id', authenticate, authorizeAppointmentAccess, asyncHandler(AppointmentController.getAppointmentById));
router.put('/:id', authenticate, authorizeAppointmentAccess, asyncHandler(AppointmentController.updateAppointment));
router.put('/:id/reschedule', authenticate, authorizeAppointmentAccess, asyncHandler(AppointmentController.rescheduleAppointment));
router.delete('/:id', authenticate, authorizeAppointmentAccess, asyncHandler(AppointmentController.cancelAppointment));

module.exports = router;