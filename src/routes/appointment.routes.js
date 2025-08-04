const express = require('express');
const AppointmentController = require('../controllers/appointment.controller');
const asyncHandler = require('../utils/asyncHandler');
const {
  authenticate,
  authorize,
  authorizeAppointmentAccess,
  authorizePatientAppointments
} = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * ===============================================
 * STANDARDIZED APPOINTMENT BOOKING API ROUTES
 * ===============================================
 * 
 * Unified Authorization Model:
 * - Single endpoint handles both doctor and patient appointment creation
 * - Smart backend routing based on user role
 * - Patients: Automatically book for themselves (patient_id ignored)
 * - Doctors/Staff/Admin: Can book for any patient (patient_id required)
 * - Public: Can view doctor availability only
 * 
 * Key Endpoint:
 * - POST /appointments - Universal appointment creation (smart routing)
 */

// ===============================================
// PUBLIC ROUTES (No Authentication Required)
// ===============================================

/**
 * Get available doctors
 * GET /appointments/doctors?is_available=true&specialization=chiropractic&date=2025-06-29
 */
router.get('/doctors',
  asyncHandler(AppointmentController.getAllDoctors)
);

/**
 * Get doctor availability  
 * GET /appointments/doctors/:doctorId/availability?date=2025-06-29&days_ahead=30
 */
router.get('/doctors/:doctor_id/availability',
  asyncHandler(AppointmentController.getDoctorAvailability)
);

// ===============================================
// APPOINTMENT BOOKING ROUTES (Universal)
// ===============================================

/**
 * Create new appointment (Universal smart routing)
 * POST /appointments
 * Body: { 
 *   // Option 1: Traditional format
 *   doctor_id?, patient_id?, 
 *   // Option 2: Sender/Recipient format
 *   sender_id?, recipient_id?, 
 *   // Common fields
 *   appointment_date, appointment_time, 
 *   location, reason_for_visit, additional_notes 
 * }
 * Auth: doctor, admin, staff, patient
 * 
 * Universal Logic:
 * - Automatically detects and maps sender_id/recipient_id to doctor_id/patient_id
 * - Supports all user types (patient, doctor, admin, staff) without separate functions
 * - Prevents patient-to-patient appointments
 * - Flexible doctor validation (handles doctor records, admin, and staff users)
 * - Patient users automatically book for themselves (security override)
 */
router.post('/',
  authenticate,
  authorize('doctor', 'admin', 'staff', 'patient'),
  asyncHandler(AppointmentController.createAppointment)
);

// ===============================================
// UTILITY ROUTES (All Authenticated Users)
// ===============================================

/**
 * Check appointment availability
 * POST /appointments/check-availability
 * Body: { doctor_id, date, time }
 * Auth: Any authenticated user
 */
router.post('/check-availability',
  authenticate,
  asyncHandler(AppointmentController.checkAvailability)
);

// ===============================================
// PATIENT-SPECIFIC ROUTES (Patients Only)
// ===============================================

/**
 * Get current user's appointments (Patients only - can only see their own)
 * GET /appointments/me?status=scheduled&upcoming_only=true&page=1&limit=10
 * Auth: patient only
 */
router.get('/me',
  authenticate,
  authorize('patient'),
  asyncHandler(AppointmentController.getMyAppointments)
);

// ===============================================
// STAFF/DOCTOR MANAGEMENT ROUTES
// ===============================================

/**
 * Get appointments by patient ID (Doctor/Staff only)
 * GET /appointments/patient/:patientId?status=scheduled&date_from=2025-01-01
 * Auth: doctor, admin, staff only
 */
router.get('/patient/:patient_id',
  authenticate,
  authorize('doctor', 'admin', 'staff'),
  asyncHandler(AppointmentController.getPatientAppointments)
);

/**
 * Get appointment statistics (Doctor/Staff only)
 * GET /appointments/stats?date_from=2025-01-01&date_to=2025-12-31
 * Auth: doctor, admin, staff
 */
router.get('/stats',
  authenticate,
  authorize('doctor', 'admin', 'staff'),
  asyncHandler(AppointmentController.getAppointmentStats)
);

/**
 * Get appointments (Role-based filtering)
 * GET /appointments?status=scheduled&doctor_id=1&page=1&limit=10
 * Auth: All authenticated users
 * - Patients: Only see their own appointments
 * - Doctors: Only see appointments assigned to them
 * - Staff/Admin: See all appointments
 */
router.get('/',
  authenticate,
  authorize('doctor', 'admin', 'staff', 'patient'),
  asyncHandler(AppointmentController.getAllAppointments)
);

// ===============================================
// INDIVIDUAL APPOINTMENT ROUTES
// ===============================================

/**
 * Get specific appointment by ID
 * Auth: All roles (with ownership verification)
 * - Patients: Only their own appointments
 * - Doctors/Staff: Any appointment
 */
router.get('/:id',
  authenticate,
  authorize('doctor', 'admin', 'staff', 'patient'),
  authorizeAppointmentAccess,
  asyncHandler(AppointmentController.getAppointmentById)
);

/**
 * Update appointment (Doctor/Staff only)
 * PUT /appointments/:id
 * Body: { appointment_date, appointment_time, status, notes, ... }
 * Auth: doctor, admin, staff only
 */
router.put('/:id',
  authenticate,
  authorize('doctor', 'admin', 'staff'),
  authorizeAppointmentAccess,
  asyncHandler(AppointmentController.updateAppointment)
);

/**
 * Reschedule appointment
 * PUT /appointments/:id/reschedule
 * Body: { new_date, new_time, reason }
 * Auth: All roles (with ownership verification)
 * - Patients: Only their own appointments
 * - Doctors/Staff: Any appointment
 */
router.put('/:id/reschedule',
  authenticate,
  authorize('doctor', 'admin', 'staff', 'patient'),
  authorizeAppointmentAccess,
  asyncHandler(AppointmentController.rescheduleAppointment)
);

/**
 * Cancel/Delete appointment
 * DELETE /appointments/:id
 * Body: { reason, notify_patient }
 * Auth: All roles (with ownership verification)
 * - Patients: Only their own appointments
 * - Doctors/Staff: Any appointment
 */
router.delete('/:id',
  authenticate,
  authorize('doctor', 'admin', 'staff', 'patient'),
  authorizeAppointmentAccess,
  asyncHandler(AppointmentController.cancelAppointment)
);

module.exports = router; 