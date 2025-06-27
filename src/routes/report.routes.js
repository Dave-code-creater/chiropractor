const express = require('express');
const ReportController = require('../controllers/report.controller');
const asyncHandler = require('../utils/asyncHandler');
const { SuccessResponse } = require('../utils/httpResponses');

const router = express.Router();

// Report management routes
router.get('/', asyncHandler(ReportController.getAllReports));

// Patient intake system routes
router.post('/patient-intake', asyncHandler(ReportController.createPatientIntake));
router.post('/insurance-details', asyncHandler(ReportController.createInsuranceDetails));
router.post('/pain-descriptions', asyncHandler(ReportController.createPainEvaluation));
router.post('/details-descriptions', asyncHandler(ReportController.createDetailedDescription));
router.post('/work-impact', asyncHandler(ReportController.createWorkImpact));
router.post('/health-conditions', asyncHandler(ReportController.createHealthCondition));

// Doctor report routes
router.post('/doctor-initial', asyncHandler(ReportController.createDoctorInitialReport));

// Placeholder routes - to be implemented with actual controllers
router.get('/:id', asyncHandler(async (req, res) => {
  const response = new SuccessResponse('Report retrieved successfully', 200, {});
  response.send(res);
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const response = new SuccessResponse('Report updated successfully', 200, {});
  response.send(res);
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const response = new SuccessResponse('Report deleted successfully', 200, {});
  response.send(res);
}));

module.exports = router; 