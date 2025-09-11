const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');
const IncidentController = require('../controllers/incident.controller');
const { createIncidentValidator, updateIncidentValidator, incidentNoteValidator } = require('../validators');

const router = express.Router();

/**
 * ===============================================
 * PATIENT INITIAL REPORTS - DR. DIEU PHAN WORKFLOW
 * ===============================================
 * 
 * Simplified workflow:
 * 1. Patient creates initial incident report
 * 2. Patient fills out assessment forms
 * 3. Dr. Dieu Phan reviews report
 * 4. Dr. Dieu Phan creates treatment plan
 */

// All incident routes require authentication
router.use(authenticate);

// ===============================================
// PATIENT INITIAL REPORT SUBMISSION
// ===============================================

/**
 * Patient creates initial incident report
 * POST /incidents
 */
router.post('/', 
  authorize(['patient']),
  createIncidentValidator, 
  asyncHandler(IncidentController.createIncident)
);

/**
 * Get patient's own incidents OR all incidents for doctor review
 * GET /incidents
 */
router.get('/', asyncHandler(IncidentController.getUserIncidents));

// Single incident details
router.get('/:id', asyncHandler(IncidentController.getIncidentById));
router.put('/:id', updateIncidentValidator, asyncHandler(IncidentController.updateIncident));
router.delete('/:id', asyncHandler(IncidentController.deleteIncident));

// Simple form submission endpoints (like signup forms)
router.post('/:id/patient-info', asyncHandler(IncidentController.submitPatientInfoForm));
router.post('/:id/health-insurance', asyncHandler(IncidentController.submitHealthInsuranceForm));
router.post('/:id/pain-description-form', asyncHandler(IncidentController.submitPainDescriptionFormNew));
router.post('/:id/pain-assessment-form', asyncHandler(IncidentController.submitPainAssessmentFormNew));
router.post('/:id/medical-history-form', asyncHandler(IncidentController.submitMedicalHistoryFormNew));
router.post('/:id/lifestyle-impact-form', asyncHandler(IncidentController.submitLifestyleImpactFormNew));
router.get('/:id/available-forms', asyncHandler(IncidentController.getAvailableIncidentForms));

// Incident notes
router.post('/:id/notes', incidentNoteValidator, asyncHandler(IncidentController.addIncidentNote));

// ===============================================
// DR. DIEU PHAN TREATMENT PLAN MANAGEMENT
// ===============================================

/**
 * Dr. Dieu Phan creates treatment plan after reviewing initial report
 * POST /incidents/:id/treatment-plan
 */
router.post('/:id/treatment-plan', 
  authorize(['doctor']),
  asyncHandler(IncidentController.createTreatmentPlan)
);

/**
 * Get treatment plan (doctor or patient can view)
 * GET /incidents/:id/treatment-plan
 */
router.get('/:id/treatment-plan', 
  asyncHandler(IncidentController.getTreatmentPlan)
);

/**
 * Dr. Dieu Phan updates treatment plan (adjust frequency, extend duration)
 * PUT /incidents/:id/treatment-plan/:treatmentPlanId
 */
router.put('/:id/treatment-plan/:treatmentPlanId',
  authorize(['doctor']),
  asyncHandler(IncidentController.updateTreatmentPlan)
);

module.exports = router; 