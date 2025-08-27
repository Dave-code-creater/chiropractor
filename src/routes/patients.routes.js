const express = require('express');
const UserController = require('../controllers/user.controller');
const IncidentService = require('../services/incident.service');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { SuccessResponse } = require('../utils/httpResponses');

const router = express.Router();

/**
 * ===============================================
 * PATIENTS API ROUTES
 * ===============================================
 * 
 * All patient-related endpoints consolidated here
 * Role-based Access:
 * - Doctors: Only see their own patients (via incident relationships)
 * - Admin/Staff: See all patients
 * - Patients: Only access their own data
 */

/**
 * Create new patient
 * POST /patients
 */
router.post('/',
  authenticate,
  authorize(['doctor', 'admin']),
  asyncHandler(UserController.createPatient)
);

/**
 * Get all patients (with role-based filtering)
 * GET /patients
 */
router.get('/',
  authenticate,
  authorize(['doctor', 'admin', 'staff']),
  asyncHandler(async (req, res) => {
    if (req.user.role === 'doctor') {
      // Doctors only see their patients through the incident service
      const patients = await IncidentService.getDoctorPatients(req.user.id, req.query);
      return new SuccessResponse('Doctor patients retrieved successfully', 200, patients).send(res);
    } else {
      // Admin/Staff see all patients using the existing controller
      return await UserController.getAllPatients(req, res);
    }
  })
);

/**
 * Get specific patient by ID
 * GET /patients/:id
 */
router.get('/:id',
  authenticate,
  authorize(['doctor', 'admin', 'patient']),
  asyncHandler(UserController.getPatientById)
);

/**
 * Update patient information
 * PUT /patients/:id
 */
router.put('/:id',
  authenticate,
  authorize(['doctor', 'admin']),
  asyncHandler(UserController.updatePatient)
);

/**
 * Add clinical notes for patient
 * POST /patients/:id/clinical-notes
 */
router.post('/:id/clinical-notes',
  authenticate,
  authorize(['doctor', 'admin']),
  asyncHandler(UserController.addClinicalNotes)
);

/**
 * Get clinical notes for patient
 * GET /patients/:id/clinical-notes
 */
router.get('/:id/clinical-notes',
  authenticate,
  authorize(['doctor', 'admin', 'patient']),
  asyncHandler(UserController.getClinicalNotes)
);

module.exports = router;
