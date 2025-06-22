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
const asyncHandler = require('../helper/asyncHandler.js');
const router = Router();

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
router.use(jwtMiddleware);

// ========================================
// TEMPLATE-BASED FORMS API v1
// ========================================

// Template Management Endpoints
router.get('/v1/templates', asyncHandler(TemplateController.getTemplates));
router.get('/v1/templates/:templateId', asyncHandler(TemplateController.getTemplateById));

// Report Management Endpoints
router.post('/v1/reports', asyncHandler(ReportController.createReport));
router.get('/v1/reports', asyncHandler(ReportController.getReports));
router.get('/v1/reports/:reportId', asyncHandler(ReportController.getReportById));
router.put('/v1/reports/:reportId', asyncHandler(ReportController.updateReport));
router.delete('/v1/reports/:reportId', asyncHandler(ReportController.deleteReport));

// Form Section Endpoints
router.post('/v1/reports/:reportId/patient-intake', asyncHandler(ReportController.submitPatientIntake));
router.put('/v1/reports/:reportId/patient-intake/:intakeId', asyncHandler(ReportController.updatePatientIntake));
router.get('/v1/reports/:reportId/patient-intake', asyncHandler(ReportController.getPatientIntake));

router.post('/v1/reports/:reportId/insurance-details', asyncHandler(ReportController.submitInsuranceDetails));
router.post('/v1/reports/:reportId/pain-evaluation', asyncHandler(ReportController.submitPainEvaluation));
router.post('/v1/reports/:reportId/detailed-description', asyncHandler(ReportController.submitDetailedDescription));
router.post('/v1/reports/:reportId/work-impact', asyncHandler(ReportController.submitWorkImpact));
router.post('/v1/reports/:reportId/health-conditions', asyncHandler(ReportController.submitHealthConditions));

// ========================================
// LEGACY ENDPOINTS REMOVED
// All form functionality now handled by the template-based system above
// ========================================

// Patient Management Routes
router.get('/patients', asyncHandler(PatientController.getAllPatients));
router.get('/patients/stats', asyncHandler(PatientController.getPatientStats));
router.get('/patients/:id', asyncHandler(PatientController.getPatientById));
router.post('/patients', asyncHandler(PatientController.createPatient));
router.put('/patients/:id', asyncHandler(PatientController.updatePatient));
router.get('/patients/:id/medical-history', asyncHandler(PatientController.getPatientMedicalHistory));

// Initial Report (combines all user report sections)
router.get('/initial-report', asyncHandler(PatientController.getInitialReport));

// Dashboard Analytics Routes
router.get('/dashboard/stats', asyncHandler(DashboardController.getDashboardStats));
router.get('/appointments/stats', asyncHandler(DashboardController.getAppointmentStats));
router.get('/reports/appointments', asyncHandler(DashboardController.getAppointmentReports));
router.get('/reports/patients', asyncHandler(DashboardController.getPatientReports));

// =============================================================================
// v1/api/2025 ROUTES (NEW CONSISTENT VERSIONING)
// =============================================================================

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

// Enhanced Patient Management (v1/api/2025)
router.get('/v1/api/2025/patients', asyncHandler(PatientController.getAllPatients));
router.get('/v1/api/2025/patients/stats', asyncHandler(PatientController.getPatientStats));
router.get('/v1/api/2025/patients/:id', asyncHandler(PatientController.getPatientById));
router.post('/v1/api/2025/patients', asyncHandler(PatientController.createPatient));
router.put('/v1/api/2025/patients/:id', asyncHandler(PatientController.updatePatient));
router.get('/v1/api/2025/patients/:id/medical-history', asyncHandler(PatientController.getPatientMedicalHistory));

// Enhanced Template System (v1/api/2025)
router.get('/v1/api/2025/templates', asyncHandler(TemplateController.getTemplates));
router.get('/v1/api/2025/templates/:templateId', asyncHandler(TemplateController.getTemplateById));

// Enhanced Report Management (v1/api/2025)
router.post('/v1/api/2025/reports', asyncHandler(ReportController.createReport));
router.get('/v1/api/2025/reports', asyncHandler(ReportController.getReports));
router.get('/v1/api/2025/reports/:reportId', asyncHandler(ReportController.getReportById));
router.put('/v1/api/2025/reports/:reportId', asyncHandler(ReportController.updateReport));
router.delete('/v1/api/2025/reports/:reportId', asyncHandler(ReportController.deleteReport));

// Enhanced Form Submissions (v1/api/2025)
router.post('/v1/api/2025/reports/:reportId/patient-intake', asyncHandler(ReportController.submitPatientIntake));
router.put('/v1/api/2025/reports/:reportId/patient-intake/:intakeId', asyncHandler(ReportController.updatePatientIntake));
router.get('/v1/api/2025/reports/:reportId/patient-intake', asyncHandler(ReportController.getPatientIntake));
router.post('/v1/api/2025/reports/:reportId/insurance-details', asyncHandler(ReportController.submitInsuranceDetails));
router.post('/v1/api/2025/reports/:reportId/pain-evaluation', asyncHandler(ReportController.submitPainEvaluation));
router.post('/v1/api/2025/reports/:reportId/detailed-description', asyncHandler(ReportController.submitDetailedDescription));
router.post('/v1/api/2025/reports/:reportId/work-impact', asyncHandler(ReportController.submitWorkImpact));
router.post('/v1/api/2025/reports/:reportId/health-conditions', asyncHandler(ReportController.submitHealthConditions));

// Enhanced Dashboard (v1/api/2025)
router.get('/v1/api/2025/dashboard/stats', asyncHandler(DashboardController.getDashboardStats));
router.get('/v1/api/2025/dashboard/appointments/stats', asyncHandler(DashboardController.getAppointmentStats));
router.get('/v1/api/2025/dashboard/reports/appointments', asyncHandler(DashboardController.getAppointmentReports));
router.get('/v1/api/2025/dashboard/reports/patients', asyncHandler(DashboardController.getPatientReports));

module.exports = router;
