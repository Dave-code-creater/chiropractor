const express = require('express');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');
const IncidentController = require('../controllers/incident.controller');
const { createIncidentValidator, updateIncidentValidator, incidentNoteValidator } = require('../validators');

const router = express.Router();

router.use(authenticate);

/**
 * @swagger
 * tags:
 *   name: Incidents
 *   description: Injury intake workflows, forms, and treatment plans
 */

// Incident CRUD
/**
 * @swagger
 * /incidents:
 *   post:
 *     summary: Create a new incident report
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncidentCreateRequest'
 *     responses:
 *       201:
 *         description: Incident created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', authorize('patient'), createIncidentValidator, asyncHandler(IncidentController.createIncident));
/**
 * @swagger
 * /incidents:
 *   get:
 *     summary: Get incidents accessible to the user
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: integer
 *         description: Filter by patient ID (doctor/admin only)
 *       - in: query
 *         name: doctor_id
 *         schema:
 *           type: integer
 *         description: Filter by doctor ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Incidents retrieved successfully
 */
router.get('/', asyncHandler(IncidentController.getUserIncidents));
/**
 * @swagger
 * /incidents/{id}:
 *   get:
 *     summary: Get incident by ID
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Incident retrieved successfully
 *       404:
 *         description: Incident not found
 */
router.get('/:id', asyncHandler(IncidentController.getIncidentById));
/**
 * @swagger
 * /incidents/{id}:
 *   put:
 *     summary: Update incident details
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncidentUpdateRequest'
 *     responses:
 *       200:
 *         description: Incident updated successfully
 */
router.put('/:id', updateIncidentValidator, asyncHandler(IncidentController.updateIncident));
/**
 * @swagger
 * /incidents/{id}:
 *   delete:
 *     summary: Delete an incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Incident deleted successfully
 */
router.delete('/:id', asyncHandler(IncidentController.deleteIncident));

// Form submissions
/**
 * @swagger
 * /incidents/{id}/patient-info:
 *   post:
 *     summary: Submit patient information form for an incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncidentFormRequest'
 *     responses:
 *       200:
 *         description: Form submitted successfully
 */
router.post('/:id/patient-info', asyncHandler(IncidentController.submitPatientInfoForm));
/**
 * @swagger
 * /incidents/{id}/health-insurance:
 *   post:
 *     summary: Submit health insurance form for an incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncidentFormRequest'
 *     responses:
 *       200:
 *         description: Form submitted successfully
 */
router.post('/:id/health-insurance', asyncHandler(IncidentController.submitHealthInsuranceForm));
/**
 * @swagger
 * /incidents/{id}/pain-description-form:
 *   post:
 *     summary: Submit pain description form
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncidentFormRequest'
 *     responses:
 *       200:
 *         description: Form submitted successfully
 */
router.post('/:id/pain-description-form', asyncHandler(IncidentController.submitPainDescriptionFormNew));
/**
 * @swagger
 * /incidents/{id}/pain-assessment-form:
 *   post:
 *     summary: Submit pain assessment form
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncidentFormRequest'
 *     responses:
 *       200:
 *         description: Form submitted successfully
 */
router.post('/:id/pain-assessment-form', asyncHandler(IncidentController.submitPainAssessmentFormNew));
/**
 * @swagger
 * /incidents/{id}/medical-history-form:
 *   post:
 *     summary: Submit medical history form
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncidentFormRequest'
 *     responses:
 *       200:
 *         description: Form submitted successfully
 */
router.post('/:id/medical-history-form', asyncHandler(IncidentController.submitMedicalHistoryFormNew));
/**
 * @swagger
 * /incidents/{id}/lifestyle-impact-form:
 *   post:
 *     summary: Submit lifestyle impact form
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncidentFormRequest'
 *     responses:
 *       200:
 *         description: Form submitted successfully
 */
router.post('/:id/lifestyle-impact-form', asyncHandler(IncidentController.submitLifestyleImpactFormNew));
/**
 * @swagger
 * /incidents/{id}/available-forms:
 *   get:
 *     summary: Get available forms for an incident type
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Available forms retrieved successfully
 */
router.get('/:id/available-forms', asyncHandler(IncidentController.getAvailableIncidentForms));

// Notes and treatment plans
/**
 * @swagger
 * /incidents/{id}/notes:
 *   post:
 *     summary: Add a note to an incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/IncidentNoteRequest'
 *     responses:
 *       201:
 *         description: Incident note added successfully
 */
router.post('/:id/notes', incidentNoteValidator, asyncHandler(IncidentController.addIncidentNote));
/**
 * @swagger
 * /incidents/{id}/treatment-plan:
 *   post:
 *     summary: Create a treatment plan for an incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TreatmentPlanRequest'
 *     responses:
 *       201:
 *         description: Treatment plan created successfully
 */
router.post('/:id/treatment-plan', authorize('doctor'), asyncHandler(IncidentController.createTreatmentPlan));
/**
 * @swagger
 * /incidents/{id}/treatment-plan:
 *   get:
 *     summary: Get the treatment plan for an incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Treatment plan retrieved successfully
 */
router.get('/:id/treatment-plan', asyncHandler(IncidentController.getTreatmentPlan));
/**
 * @swagger
 * /incidents/{id}/treatment-plan/{treatmentPlanId}:
 *   put:
 *     summary: Update a treatment plan
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: treatmentPlanId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TreatmentPlanUpdateRequest'
 *     responses:
 *       200:
 *         description: Treatment plan updated successfully
 */
router.put('/:id/treatment-plan/:treatmentPlanId', authorize('doctor'), asyncHandler(IncidentController.updateTreatmentPlan));

module.exports = router; 
