const { BadRequestError, NotFoundError, InternalServerError } = require('../utils/httpResponses');
const { getUserRepository, getPatientRepository } = require('../repositories');
const { patientIntakeSchema, doctorInitialReportSchema } = require('../validators').schemas;
const { info, error: logError, debug, warn } = require('../utils/logger');

/**
 * Report Service
 * Static methods for medical reports business logic
 * 
 * Flow: [Controller] -> [Service] -> [Repository] -> [Database]
 */
class ReportService {
  /**
   * Create a patient intake report
   * @param {Object} reportData - Report creation data
   * @param {Object} req - Request object
   * @returns {Object} Report creation result
   */
  static async createPatientIntakeReport(reportData, req) {
    try {
      const userRepo = getUserRepository();
      const patientRepo = getPatientRepository();

      // Get user email from JWT token
      const userEmail = req.user?.email;
      if (!userEmail) {
        throw new BadRequestError('User email not found in token', '4003');
      }

      // Handle both nested and flat data structures
      let intakeData;
      if (reportData.patientIntake) {
        // Nested structure from frontend
        intakeData = reportData.patientIntake;
      } else {
        // Flat structure (direct submission)
        intakeData = reportData;
      }

      // Map frontend field names to database field names
      const mappedData = {
        first_name: intakeData.first_name,
        middle_name: intakeData.middle_name || '',
        last_name: intakeData.last_name,
        ssn: intakeData.ssn,
        date_of_birth: intakeData.date_of_birth,
        gender: intakeData.gender?.toLowerCase(), // Convert to lowercase for database enum
        marital_status: intakeData.marital_status,
        race: intakeData.race,
        street: intakeData.address || intakeData.street,  // Handle both field names
        city: intakeData.city,
        state: intakeData.state,
        zip: intakeData.zip_code || intakeData.zip,       // Handle both field names
        home_phone: intakeData.home_phone,
        cell_phone: intakeData.cell_phone || '',
        emergency_contact: intakeData.emergency_contact_name || intakeData.emergency_contact,
        emergency_contact_phone: intakeData.emergency_contact_phone,
        emergency_contact_relationship: intakeData.emergency_contact_relationship
      };

      debug('Mapped patient intake data:', mappedData);

      // Validate the mapped data
      const { error } = patientIntakeSchema.validate(mappedData);
      if (error) throw new BadRequestError(error.details[0].message, '4001');

      // Create intake report with email from JWT
      const report = await userRepo.createIntakeReport(mappedData, req.user?.id);

      info(' Patient intake report created:', { 
        report_id: report.id,
        email: userEmail
      });

      return report;

    } catch (error) {
      logError('Create patient intake report service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to create patient intake report', '5001');
    }
  }

  /**
   * Create a doctor's initial report
   * @param {Object} reportData - Report creation data
   * @param {Object} req - Request object
   * @returns {Object} Report creation result
   */
  static async createDoctorInitialReport(reportData, req) {
    const { error } = doctorInitialReportSchema.validate(reportData);
    if (error) throw new BadRequestError(error.details[0].message, '4001');

    try {
      const userRepo = getUserRepository();
      const patientRepo = getPatientRepository();

      const {
        patient_id,
        appointment_id,
        examination_findings,
        diagnosis,
        recommended_treatment,
        treatment_plan,
        follow_up_instructions,
        prescribed_medications,
        restrictions,
        next_appointment_recommendation,
        doctor_notes
      } = reportData;

      // Validate patient exists
      const patient = await patientRepo.findPatientById(patient_id);
      if (!patient) {
        throw new NotFoundError('Patient not found', '4041');
      }

      // Create doctor's initial report
      const report = await userRepo.createInitialReport({
        patient_id,
        appointment_id,
        report_type: 'doctor_initial',
        examination_findings: JSON.stringify(examination_findings || {}),
        diagnosis,
        recommended_treatment,
        treatment_plan: JSON.stringify(treatment_plan || []),
        follow_up_instructions,
        prescribed_medications: JSON.stringify(prescribed_medications || []),
        restrictions: JSON.stringify(restrictions || []),
        next_appointment_recommendation,
        doctor_notes,
        status: 'completed',
        created_by: req.user?.id,
        doctor_id: req.user?.id
      });

      info(' Doctor initial report created:', { 
        report_id: report.id,
        patient_id,
        doctor_id: req.user?.id
      });

      return ReportService.formatReportResponse(report);

    } catch (error) {
      logError('Create doctor initial report service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to create doctor initial report', '5002');
    }
  }

  /**
   * Get all reports with filtering and pagination
   * @param {Object} query - Query parameters
   * @returns {Object} Paginated reports list
   */
  static async getAllReports(query = {}) {
    try {
      const userRepo = getUserRepository();
      
      const {
        page = 1,
        limit = 10,
        patient_id,
        report_type,
        status,
        doctor_id,
        date_from,
        date_to,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = query;

      const offset = (page - 1) * limit;

      const result = await userRepo.findAllReports({
        patient_id,
        report_type,
        status,
        doctor_id,
        date_from,
        date_to,
        sort_by,
        sort_order,
        limit: parseInt(limit),
        offset
      });

      info(' Reports retrieved:', { 
        count: result.reports.length,
        total: result.total,
        page 
      });

      return {
        reports: result.reports.map(report => ReportService.formatReportResponse(report)),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(result.total / limit),
          total_count: result.total,
          per_page: parseInt(limit),
          has_next: page * limit < result.total,
          has_prev: page > 1
        }
      };

    } catch (error) {
      logError('Get all reports service error:', error);
      throw new InternalServerError('Failed to retrieve reports', '5003');
    }
  }

  /**
   * Get report by ID
   * @param {number} reportId - Report ID
   * @returns {Object} Report details
   */
  static async getReportById(reportId) {
    try {
      const userRepo = getUserRepository();
      
      const report = await userRepo.findReportById(reportId);
      if (!report) {
        throw new NotFoundError('Report not found', '4044');
      }

      info(' Report retrieved:', { report_id: reportId });

      return ReportService.formatReportResponse(report);

    } catch (error) {
      logError('Get report by ID service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to retrieve report', '5004');
    }
  }

  /**
   * Update report
   * @param {number} reportId - Report ID
   * @param {Object} updateData - Report update data
   * @returns {Object} Updated report
   */
  static async updateReport(reportId, updateData) {
    try {
      const userRepo = getUserRepository();
      
      const existingReport = await userRepo.findReportById(reportId);
      if (!existingReport) {
        throw new NotFoundError('Report not found', '4044');
      }

      const updatedReport = await userRepo.updateReport(reportId, updateData);

      info(' Report updated:', { report_id: reportId });

      return ReportService.formatReportResponse(updatedReport);

    } catch (error) {
      logError('Update report service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to update report', '5005');
    }
  }

  /**
   * Get patient reports
   * @param {number} patientId - Patient ID
   * @param {Object} query - Query parameters
   * @returns {Object} Patient's reports
   */
  static async getPatientReports(patientId, query = {}) {
    try {
      const userRepo = getUserRepository();
      const patientRepo = getPatientRepository();

      // First try to find patient by ID
      let patient = await patientRepo.findPatientById(patientId);
      
      // If not found, try to find by user ID (in case patientId is actually a user ID)
      if (!patient) {
        patient = await patientRepo.findByUserId(patientId);
        
        // If still not found, create a basic patient record for this user
        if (!patient) {
          const user = await userRepo.findById(patientId);
          if (!user) {
            throw new NotFoundError('User not found', '4041');
          }
          
          // Create basic patient record
          patient = await patientRepo.createPatient({
            user_id: patientId,
            first_name: user.username || 'Patient',
            last_name: '',
            email: user.email,
            status: 'active'
          });
          
          logError('Auto-created patient record for user:', { 
            user_id: patientId, 
            patient_id: patient.id 
          });
        }
      }

      const {
        page = 1,
        limit = 10,
        report_type,
        status,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = query;

      const offset = (page - 1) * limit;

      const result = await userRepo.findPatientReports({
        patient_id: patientId,
        report_type,
        status,
        sort_by,
        sort_order,
        limit: parseInt(limit),
        offset
      });

      info(' Patient reports retrieved:', { 
        patient_id: patientId,
        count: result.reports.length 
      });

      return {
        reports: result.reports.map(report => ReportService.formatReportResponse(report)),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(result.total / limit),
          total_count: result.total,
          per_page: parseInt(limit),
          has_next: page * limit < result.total,
          has_prev: page > 1
        }
      };

    } catch (error) {
      logError('Get patient reports service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to retrieve patient reports', '5006');
    }
  }

  /**
   * Get doctor reports
   * @param {number} doctorId - Doctor ID
   * @param {Object} query - Query parameters
   * @returns {Object} Doctor's reports
   */
  static async getDoctorReports(doctorId, query = {}) {
    try {
      const userRepo = getUserRepository();

      const {
        page = 1,
        limit = 10,
        patient_id,
        report_type,
        status,
        date_from,
        date_to,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = query;

      const offset = (page - 1) * limit;

      const result = await userRepo.findDoctorReports({
        doctor_id: doctorId,
        patient_id,
        report_type,
        status,
        date_from,
        date_to,
        sort_by,
        sort_order,
        limit: parseInt(limit),
        offset
      });

      info(' Doctor reports retrieved:', { 
        doctor_id: doctorId,
        count: result.reports.length 
      });

      return {
        reports: result.reports.map(report => ReportService.formatReportResponse(report)),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(result.total / limit),
          total_count: result.total,
          per_page: parseInt(limit),
          has_next: page * limit < result.total,
          has_prev: page > 1
        }
      };

    } catch (error) {
      logError('Get doctor reports service error:', error);
      throw new InternalServerError('Failed to retrieve doctor reports', '5007');
    }
  }

  /**
   * Generate report summary
   * @param {number} reportId - Report ID
   * @returns {Object} Report summary
   */
  static async generateReportSummary(reportId) {
    try {
      const userRepo = getUserRepository();
      
      const report = await userRepo.findReportById(reportId);
      if (!report) {
        throw new NotFoundError('Report not found', '4044');
      }

      // Generate summary based on report type
      let summary = {};

      if (report.report_type === 'patient_intake') {
        summary = {
          type: 'Patient Intake Summary',
          patient_name: report.patient_name,
          chief_complaint: report.chief_complaint,
          pain_level: report.pain_level,
          symptom_duration: report.symptom_duration,
          key_symptoms: JSON.parse(report.current_symptoms || '[]').slice(0, 3),
          medications_count: JSON.parse(report.medications || '[]').length,
          allergies_count: JSON.parse(report.allergies || '[]').length
        };
      } else if (report.report_type === 'doctor_initial') {
        summary = {
          type: 'Doctor Initial Report Summary',
          patient_name: report.patient_name,
          doctor_name: report.doctor_name,
          diagnosis: report.diagnosis,
          treatment_plan_items: JSON.parse(report.treatment_plan || '[]').length,
          medications_prescribed: JSON.parse(report.prescribed_medications || '[]').length,
          follow_up_required: !!report.next_appointment_recommendation
        };
      }

      info(' Report summary generated:', { report_id: reportId });

      return {
        report_id: reportId,
        summary,
        generated_at: new Date()
      };

    } catch (error) {
      logError('Generate report summary service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to generate report summary', '5008');
    }
  }

  /**
   * Format report response
   * @param {Object} report - Raw report data
   * @returns {Object} Formatted report
   */
  static formatReportResponse(report) {
    if (!report) return null;

    const formattedReport = {
      id: report.id,
      patient_id: report.patient_id,
      patient_name: report.patient_name || 
        `${report.patient_first_name} ${report.patient_last_name}`,
      doctor_id: report.doctor_id,
      doctor_name: report.doctor_name || 
        `${report.doctor_first_name} ${report.doctor_last_name}`,
      appointment_id: report.appointment_id,
      report_type: report.report_type,
      status: report.status,
      created_at: report.created_at,
      updated_at: report.updated_at
    };

    // Add type-specific fields
    if (report.report_type === 'patient_intake') {
      formattedReport.intake_details = {
        chief_complaint: report.chief_complaint,
        current_symptoms: ReportService.parseJSON(report.current_symptoms),
        symptom_duration: report.symptom_duration,
        pain_level: report.pain_level,
        pain_description: report.pain_description,
        previous_treatments: ReportService.parseJSON(report.previous_treatments),
        medications: ReportService.parseJSON(report.medications),
        allergies: ReportService.parseJSON(report.allergies),
        medical_history: ReportService.parseJSON(report.medical_history),
        insurance_details: ReportService.parseJSON(report.insurance_details),
        emergency_contact: ReportService.parseJSON(report.emergency_contact),
        work_status_impact: report.work_status_impact,
        additional_notes: report.additional_notes
      };
    } else if (report.report_type === 'doctor_initial') {
      formattedReport.doctor_report_details = {
        examination_findings: ReportService.parseJSON(report.examination_findings),
        diagnosis: report.diagnosis,
        recommended_treatment: report.recommended_treatment,
        treatment_plan: ReportService.parseJSON(report.treatment_plan),
        follow_up_instructions: report.follow_up_instructions,
        prescribed_medications: ReportService.parseJSON(report.prescribed_medications),
        restrictions: ReportService.parseJSON(report.restrictions),
        next_appointment_recommendation: report.next_appointment_recommendation,
        doctor_notes: report.doctor_notes
      };
    }

    return formattedReport;
  }

  /**
   * Safely parse JSON string
   * @param {string} jsonString - JSON string to parse
   * @returns {Object|Array|null} Parsed JSON or null
   */
  static parseJSON(jsonString) {
    try {
      return jsonString ? JSON.parse(jsonString) : null;
    } catch (error) {
      logError('Error parsing JSON:', error);
      return null;
    }
  }
}

module.exports = ReportService; 