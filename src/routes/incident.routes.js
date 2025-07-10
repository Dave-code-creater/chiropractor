const express = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/asyncHandler');
const ReportController = require('../controllers/report.controller');

const router = express.Router();

// All incident routes require authentication
router.use(authenticate);

// Incident CRUD operations
router.post('/', asyncHandler(ReportController.createIncident));
router.get('/', asyncHandler(ReportController.getUserIncidents));
router.get('/:id', asyncHandler(ReportController.getIncidentById));
router.put('/:id', asyncHandler(ReportController.updateIncident));
router.delete('/:id', asyncHandler(ReportController.deleteIncident));

// Incident forms
router.post('/:id/forms', asyncHandler(ReportController.saveIncidentForm));
router.put('/:id/forms/:formType', asyncHandler(ReportController.saveIncidentForm));

// Incident notes
router.post('/:id/notes', asyncHandler(ReportController.addIncidentNote));

module.exports = router; 