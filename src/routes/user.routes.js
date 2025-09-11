const express = require('express');
const UserController = require('../controllers/user.controller');
const IncidentService = require('../services/incident.service');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { SuccessResponse } = require('../utils/httpResponses');

const router = express.Router();

/**
 * ===============================================
 * DR. DIEU PHAN PATIENT MANAGEMENT
 * ===============================================
 * 
 * Simplified single-doctor practice routes:
 * - All patients belong to Dr. Dieu Phan
 * - Traditional CRUD operations
 * - Patient profile and basic management
 */

// ===============================================
// PATIENT MANAGEMENT ROUTES
// ===============================================

/**
 * Create new patient
 * POST /users/patients
 */
router.post('/patients',
  authenticate,
  authorize(['doctor', 'admin']),
  asyncHandler(UserController.createPatient)
);

/**
 * Get all patients for Dr. Dieu Phan
 * GET /users/patients
 */
router.get('/patients',
  authenticate,
  authorize(['doctor']),
  asyncHandler(UserController.getAllPatients)
);

/**
 * Get specific patient by ID
 * GET /users/patients/:id
 */
router.get('/patients/:id',
  authenticate,
  authorize(['doctor', 'admin', 'patient']),
  asyncHandler(UserController.getPatientById)
);

/**
 * Update patient information
 * PUT /users/patients/:id
 */
router.put('/patients/:id',
  authenticate,
  authorize(['doctor', 'admin']),
  asyncHandler(UserController.updatePatient)
);

/**
 * Add clinical notes for patient
 * POST /users/patients/:id/clinical-notes
 */
router.post('/patients/:id/clinical-notes',
  authenticate,
  authorize(['doctor', 'admin']),
  asyncHandler(UserController.addClinicalNotes)
);

/**
 * Get clinical notes for patient
 * GET /users/patients/:id/clinical-notes
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
 */
router.get('/profile',
  authenticate,
  asyncHandler(UserController.getProfile)
);

/**
 * Update current user's profile
 * PUT /users/profile
 */
router.put('/profile',
  authenticate,
  asyncHandler(UserController.updateProfile)
);

module.exports = router; 