const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');
const IncidentController = require('../controllers/incident.controller');
const { createIncidentValidator, updateIncidentValidator, incidentNoteValidator } = require('../validators');

const router = express.Router();

// All incident routes require authentication
router.use(authenticate);

// Incident CRUD operations
router.post('/', createIncidentValidator, asyncHandler(IncidentController.createIncident));
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

// Treatment plans
router.post('/:id/treatment-plan', asyncHandler(IncidentController.createTreatmentPlan));
router.get('/:id/treatment-plan', asyncHandler(IncidentController.getTreatmentPlan));
router.put('/:id/treatment-plan/:treatmentPlanId', asyncHandler(IncidentController.updateTreatmentPlan));

module.exports = router; 