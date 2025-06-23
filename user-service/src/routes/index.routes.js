const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const PatientController = require('../controllers/patient.controller.js');
const DashboardController = require('../controllers/dashboard.controller.js');
const TemplateController = require('../controllers/template.controller.js');
const ReportController = require('../controllers/report.controller.js');
const NotesController = require('../controllers/notes.controller.js');
const VitalsController = require('../controllers/vitals.controller.js');
const jwtMiddleware = require('../middlewares/jwt.middleware.js');
const { validateRequest } = require('../validators/vitals.validator.js');
const { createVitalsSchema, notesSchema } = require('../validators/vitals.validator.js');
const { asyncHandler, responseHandler } = require('../../../shared/utils/httpResponses.js');

const router = Router();

// Add response handler middleware
router.use(responseHandler);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', HealthController.healthCheck);

// Apply JWT middleware to all routes except health check
router.use(jwtMiddleware);

// =============================================================================
// API v1/api/2025 ROUTES (CONSISTENT VERSIONING)
// =============================================================================

// Enhanced Patient Management
router.get('/v1/api/2025/patients', asyncHandler(PatientController.getAllPatients));
router.get('/v1/api/2025/patients/stats', asyncHandler(PatientController.getPatientStats));
router.get('/v1/api/2025/patients/:id', asyncHandler(PatientController.getPatientById));
router.post('/v1/api/2025/patients', asyncHandler(PatientController.createPatient));
router.put('/v1/api/2025/patients/:id', asyncHandler(PatientController.updatePatient));
router.get('/v1/api/2025/patients/:id/medical-history', asyncHandler(PatientController.getPatientMedicalHistory));

// Clinical Notes Management
router.post('/v1/api/2025/notes', validateRequest(notesSchema), asyncHandler(NotesController.createNote));
router.get('/v1/api/2025/notes', asyncHandler(NotesController.getNotes));
router.get('/v1/api/2025/notes/:noteId', asyncHandler(NotesController.getNoteById));
router.put('/v1/api/2025/notes/:noteId', asyncHandler(NotesController.updateNote));
router.delete('/v1/api/2025/notes/:noteId', asyncHandler(NotesController.deleteNote));

// Patient-specific notes
router.get('/v1/api/2025/patients/:patientId/notes', asyncHandler(NotesController.getNotesByPatient));

// Vitals Management
router.get('/v1/api/2025/patients/:patientId/vitals', asyncHandler(VitalsController.getPatientVitals));
router.post('/v1/api/2025/patients/:patientId/vitals', validateRequest(createVitalsSchema), asyncHandler(VitalsController.recordVitals));
router.get('/v1/api/2025/patients/:patientId/vitals/summary', asyncHandler(VitalsController.getVitalsSummary));
router.get('/v1/api/2025/patients/:patientId/vitals/trends', asyncHandler(VitalsController.getVitalsTrends));

// Individual vitals records
router.get('/v1/api/2025/vitals/:vitalId', asyncHandler(VitalsController.getVitalById));
router.put('/v1/api/2025/vitals/:vitalId', asyncHandler(VitalsController.updateVital));
router.delete('/v1/api/2025/vitals/:vitalId', asyncHandler(VitalsController.deleteVital));

// Template System
router.get('/v1/api/2025/templates', asyncHandler(TemplateController.getTemplates));
router.get('/v1/api/2025/templates/:templateId', asyncHandler(TemplateController.getTemplateById));

// Report Management
router.post('/v1/api/2025/reports', asyncHandler(ReportController.createReport));
router.get('/v1/api/2025/reports', asyncHandler(ReportController.getReports));
router.get('/v1/api/2025/reports/:reportId', asyncHandler(ReportController.getReportById));
router.put('/v1/api/2025/reports/:reportId', asyncHandler(ReportController.updateReport));
router.delete('/v1/api/2025/reports/:reportId', asyncHandler(ReportController.deleteReport));

// Form Submissions
router.post('/v1/api/2025/reports/:reportId/patient-intake', asyncHandler(ReportController.submitPatientIntake));
router.put('/v1/api/2025/reports/:reportId/patient-intake/:intakeId', asyncHandler(ReportController.updatePatientIntake));
router.get('/v1/api/2025/reports/:reportId/patient-intake', asyncHandler(ReportController.getPatientIntake));
router.post('/v1/api/2025/reports/:reportId/insurance-details', asyncHandler(ReportController.submitInsuranceDetails));
router.post('/v1/api/2025/reports/:reportId/pain-evaluation', asyncHandler(ReportController.submitPainEvaluation));
router.post('/v1/api/2025/reports/:reportId/detailed-description', asyncHandler(ReportController.submitDetailedDescription));
router.post('/v1/api/2025/reports/:reportId/work-impact', asyncHandler(ReportController.submitWorkImpact));
router.post('/v1/api/2025/reports/:reportId/health-conditions', asyncHandler(ReportController.submitHealthConditions));

// Dashboard Analytics
router.get('/v1/api/2025/dashboard/stats', asyncHandler(DashboardController.getDashboardStats));
router.get('/v1/api/2025/dashboard/appointments/stats', asyncHandler(DashboardController.getAppointmentStats));
router.get('/v1/api/2025/dashboard/reports/appointments', asyncHandler(DashboardController.getAppointmentReports));
router.get('/v1/api/2025/dashboard/reports/patients', asyncHandler(DashboardController.getPatientReports));

// =============================================================================
// LEGACY ROUTES (DEPRECATED - Redirect to new API)
// These routes are maintained for backward compatibility but will be removed in future versions
// =============================================================================

// Legacy patient routes - redirect to new API
router.get('/patients', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'This endpoint has been moved. Please use /v1/api/2025/patients',
    newEndpoint: '/v1/api/2025/patients',
    deprecated: true
  });
});

router.get('/patients/stats', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'This endpoint has been moved. Please use /v1/api/2025/patients/stats',
    newEndpoint: '/v1/api/2025/patients/stats',
    deprecated: true
  });
});

// Legacy template routes - redirect to new API
router.get('/v1/templates', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'This endpoint has been moved. Please use /v1/api/2025/templates',
    newEndpoint: '/v1/api/2025/templates',
    deprecated: true
  });
});

// Legacy report routes - redirect to new API
router.get('/v1/reports', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'This endpoint has been moved. Please use /v1/api/2025/reports',
    newEndpoint: '/v1/api/2025/reports',
    deprecated: true
  });
});

// Legacy dashboard routes - redirect to new API
router.get('/dashboard/stats', (req, res) => {
  res.status(301).json({
    success: false,
    message: 'This endpoint has been moved. Please use /v1/api/2025/dashboard/stats',
    newEndpoint: '/v1/api/2025/dashboard/stats',
    deprecated: true
  });
});

module.exports = router;
