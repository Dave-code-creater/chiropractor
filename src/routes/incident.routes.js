const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');
const IncidentController = require('../controllers/incident.controller');
const { createIncidentValidator, updateIncidentValidator, incidentNoteValidator } = require('../validators');

const router = express.Router();

router.use(authenticate);

// Incident CRUD
router.post('/', authorize('patient'), createIncidentValidator, asyncHandler(IncidentController.createIncident));
router.get('/', asyncHandler(IncidentController.getUserIncidents));
router.get('/:id', asyncHandler(IncidentController.getIncidentById));
router.put('/:id', updateIncidentValidator, asyncHandler(IncidentController.updateIncident));
router.delete('/:id', asyncHandler(IncidentController.deleteIncident));

// Form submissions
router.post('/:id/patient-info', asyncHandler(IncidentController.submitPatientInfoForm));
router.post('/:id/health-insurance', asyncHandler(IncidentController.submitHealthInsuranceForm));
router.post('/:id/pain-description-form', asyncHandler(IncidentController.submitPainDescriptionFormNew));
router.post('/:id/pain-assessment-form', asyncHandler(IncidentController.submitPainAssessmentFormNew));
router.post('/:id/medical-history-form', asyncHandler(IncidentController.submitMedicalHistoryFormNew));
router.post('/:id/lifestyle-impact-form', asyncHandler(IncidentController.submitLifestyleImpactFormNew));
router.get('/:id/available-forms', asyncHandler(IncidentController.getAvailableIncidentForms));

// Notes and treatment plans
router.post('/:id/notes', incidentNoteValidator, asyncHandler(IncidentController.addIncidentNote));
router.post('/:id/treatment-plan', authorize('doctor'), asyncHandler(IncidentController.createTreatmentPlan));
router.get('/:id/treatment-plan', asyncHandler(IncidentController.getTreatmentPlan));
router.put('/:id/treatment-plan/:treatmentPlanId', authorize('doctor'), asyncHandler(IncidentController.updateTreatmentPlan));

module.exports = router; 