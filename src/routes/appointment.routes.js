const express = require('express');
const AppointmentController = require('../controllers/appointment.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize, authorizeAppointmentAccess, authorizePatientAppointments } = require('../middleware/auth.middleware');

const router = express.Router();

// Public routes
router.get('/doctors', asyncHandler(AppointmentController.getAllDoctors));
router.get('/doctors/:doctor_id/availability', asyncHandler(AppointmentController.getDoctorAvailability));

// Authenticated routes
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