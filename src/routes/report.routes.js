const express = require('express');
const ReportController = require('../controllers/report.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * ===============================================
 * STANDARDIZED REPORT MANAGEMENT API ROUTES
 * ===============================================
 * 
 * REST Conventions:
 * - All routes require authentication
 * - Role-based authorization for different operations
 * - Clear separation by report type and entity
 * - Consistent middleware patterns
 */

// ===============================================
// REPORT CREATION ROUTES
// ===============================================

/**
 * Create patient intake report
 * POST /reports/patient-intake
 * Body: { patient_id, symptoms, medical_history, ... }
 * Auth: patient, admin, staff
 */
router.post('/patient-intake', 
  authenticate, 
  authorize(['patient', 'admin', 'staff']), 
  asyncHandler(ReportController.createPatientIntakeReport)
);

/**
 * Submit comprehensive patient forms (intake + all sections)
 * POST /reports/patient-forms
 * Body: { patientIntake, insuranceDetails, painDescriptions, ... }
 * Auth: patient, admin, staff
 */
router.post('/patient-forms', 
  authenticate, 
  authorize(['patient', 'admin', 'staff']), 
  asyncHandler(ReportController.submitPatientForms)
);

/**
 * Create doctor initial assessment report
 * POST /reports/doctor-initial
 * Body: { patient_id, diagnosis, treatment_plan, ... }
 * Auth: doctor, admin, staff
 */
router.post('/doctor-initial', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff']), 
  asyncHandler(ReportController.createDoctorInitialReport)
);

// ===============================================
// ENTITY-SPECIFIC REPORT ROUTES (Must come before /:id)
// ===============================================

/**
 * Get reports for specific patient
 * GET /reports/patient/:patientId?type=intake&date_from=2025-01-01
 * Auth: doctor, admin, staff, patient (own reports only)
 */
router.get('/patient/:patientId', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ReportController.getPatientReports)
);

/**
 * Get reports for specific doctor
 * GET /reports/doctor/:doctorId?date_from=2025-01-01&limit=50
 * Auth: doctor, admin, staff
 */
router.get('/doctor/:doctorId', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff']), 
  asyncHandler(ReportController.getDoctorReports)
);

// ===============================================
// GENERAL REPORT ROUTES
// ===============================================

/**
 * Get all reports (filtered by user role)
 * GET /reports?type=intake&status=completed&page=1&limit=10
 * Auth: doctor, admin, staff (filtered automatically by role)
 */
router.get('/', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff']), 
  asyncHandler(ReportController.getAllReports)
);

/**
 * Get specific report by ID
 * GET /reports/:id
 * Auth: doctor, admin, staff, patient (with ownership verification)
 */
router.get('/:id', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ReportController.getReportById)
);

/**
 * Update report
 * PUT /reports/:id
 * Body: { status, notes, diagnosis, ... }
 * Auth: doctor, admin, staff
 */
router.put('/:id', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff']), 
  asyncHandler(ReportController.updateReport)
);

/**
 * Generate report summary
 * GET /reports/:id/summary
 * Auth: doctor, admin, staff
 */
router.get('/:id/summary', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff']), 
  asyncHandler(ReportController.generateReportSummary)
);

module.exports = router; 