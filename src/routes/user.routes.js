const express = require('express');
const UserController = require('../controllers/user.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * ===============================================
 * STANDARDIZED USER MANAGEMENT API ROUTES
 * ===============================================
 * 
 * REST Conventions:
 * - All routes require authentication
 * - Role-based authorization for different operations
 * - Clear separation between patient and clinical data
 * - Consistent middleware patterns
 */

// ===============================================
// PATIENT MANAGEMENT ROUTES
// ===============================================

/**
 * Create new patient
 * POST /users/patients
 * Body: { first_name, last_name, email, phone, ... }
 * Auth: doctor, admin, staff
 */
router.post('/patients', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff']), 
  asyncHandler(UserController.createPatient)
);

/**
 * Get all patients
 * GET /users/patients?page=1&limit=10&search=john
 * Auth: doctor, admin, staff
 */
router.get('/patients', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff']), 
  asyncHandler(UserController.getAllPatients)
);

/**
 * Get specific patient by ID
 * GET /users/patients/:id
 * Auth: doctor, admin, staff, patient (own data only)
 */
router.get('/patients/:id', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(UserController.getPatientById)
);

/**
 * Update patient information
 * PUT /users/patients/:id
 * Body: { first_name, last_name, phone, address, ... }
 * Auth: doctor, admin, staff
 */
router.put('/patients/:id', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff']), 
  asyncHandler(UserController.updatePatient)
);

// ===============================================
// CLINICAL DATA ROUTES
// ===============================================

/**
 * Add clinical notes for patient
 * POST /users/patients/:id/clinical-notes
 * Body: { notes, diagnosis, treatment_plan, ... }
 * Auth: doctor, admin, staff
 */
router.post('/patients/:id/clinical-notes', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff']), 
  asyncHandler(UserController.addClinicalNotes)
);

/**
 * Get patient's clinical notes
 * GET /users/patients/:id/clinical-notes?date_from=2025-01-01&date_to=2025-12-31
 * Auth: doctor, admin, staff, patient (own data only)
 */
router.get('/patients/:id/clinical-notes', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(UserController.getClinicalNotes)
);

/**
 * Record patient vitals
 * POST /users/patients/:id/vitals
 * Body: { blood_pressure, heart_rate, temperature, weight, ... }
 * Auth: doctor, admin, staff
 */
router.post('/patients/:id/vitals', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff']), 
  asyncHandler(UserController.recordVitals)
);

/**
 * Get patient's vitals history
 * GET /users/patients/:id/vitals?date_from=2025-01-01&limit=50
 * Auth: doctor, admin, staff, patient (own data only)
 */
router.get('/patients/:id/vitals', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(UserController.getVitalsHistory)
);

// ===============================================
// USER PROFILE ROUTES
// ===============================================

/**
 * Get current user's profile
 * GET /users/profile
 * Auth: All authenticated users
 */
router.get('/profile', 
  authenticate, 
  asyncHandler(UserController.getProfile)
);

/**
 * Create or update current user's profile
 * PUT /users/profile
 * Body: { first_name, last_name, date_of_birth, gender, ... }
 * Auth: All authenticated users
 */
router.put('/profile', 
  authenticate, 
  asyncHandler(UserController.updateProfile)
);

module.exports = router; 