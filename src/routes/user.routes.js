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
 * Auth: doctor, admin
 */
router.post('/patients',
  authenticate,
  authorize(['doctor', 'admin']),
  asyncHandler(UserController.createPatient)
);

/**
 * Get all patients
 * GET /users/patients
 * Auth: doctor, admin
 */
router.get('/patients',
  authenticate,
  authorize(['doctor', 'admin']),
  asyncHandler(UserController.getAllPatients)
);

/**
 * Get specific patient by ID
 * GET /users/patients/:id
 * Auth: doctor, admin, patient (own data only)
 */
router.get('/patients/:id',
  authenticate,
  authorize(['doctor', 'admin', 'patient']),
  asyncHandler(UserController.getPatientById)
);

/**
 * Update patient information
 * PUT /users/patients/:id
 * Body: { first_name, last_name, phone, address, ... }
 * Auth: doctor, admin
 */
router.put('/patients/:id',
  authenticate,
  authorize(['doctor', 'admin']),
  asyncHandler(UserController.updatePatient)
);

// ===============================================
// CLINICAL DATA ROUTES
// ===============================================

/**
 * Add clinical notes for patient
 * POST /users/patients/:id/clinical-notes
 * Body: { notes, diagnosis, treatment_plan, ... }
 * Auth: doctor, admin
 */
router.post('/patients/:id/clinical-notes',
  authenticate,
  authorize(['doctor', 'admin']),
  asyncHandler(UserController.addClinicalNotes)
);

/**
 * Get clinical notes for patient
 * GET /users/patients/:id/clinical-notes  
 * Auth: doctor, admin, patient (own data only)
 */
router.get('/patients/:id/clinical-notes',
  authenticate,
  authorize(['doctor', 'admin', 'patient']),
  asyncHandler(UserController.getClinicalNotes)
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