const { 
  ReportCreatedSuccess, 
  ReportsRetrievedSuccess, 
  SuccessResponse, 
  ErrorResponse 
} = require('../utils/httpResponses');
const { getPostgreSQLPool } = require('../config/database');
const { 
  patientIntakeSchema, 
  insuranceDetailsSchema, 
  painEvaluationSchema, 
  detailedDescriptionSchema, 
  workImpactSchema, 
  healthConditionSchema, 
  doctorInitialReportSchema 
} = require('../validators');
const ReportService = require('../services/ReportService');
const { api, error: logError, info, debug } = require('../utils/logger');

/**
 * Report Controller
 * Static methods that handle HTTP concerns and delegate business logic to ReportService
 * 
 * Flow: [Routing] -> [Controller] -> [Service] -> [Repository] -> [Database]
 */
class ReportController {
  /**
   * Create a patient intake report
   * POST /api/reports/patient-intake
   */
  static async createPatientIntakeReport(req, res) {
    const report = await ReportService.createPatientIntakeReport(req.body, req);
    return new ReportCreatedSuccess({ metadata: report }).send(res);
  }

  /**
   * Create a doctor's initial report
   * POST /api/reports/doctor-initial
   */
  static async createDoctorInitialReport(req, res) {
    const report = await ReportService.createDoctorInitialReport(req.body, req);
    return new ReportCreatedSuccess({ metadata: report }).send(res);
  }

  /**
   * Get all reports
   * GET /api/reports
   */
  static async getAllReports(req, res) {
    const reports = await ReportService.getAllReports(req.query);
    return new ReportsRetrievedSuccess({ metadata: reports }).send(res);
  }

  /**
   * Get report by ID
   * GET /api/reports/:id
   */
  static async getReportById(req, res) {
    const report = await ReportService.getReportById(req.params.id);
    return new SuccessResponse('Report retrieved successfully', 200, report).send(res);
  }

  /**
   * Update report
   * PUT /api/reports/:id
   */
  static async updateReport(req, res) {
    const report = await ReportService.updateReport(req.params.id, req.body);
    return new SuccessResponse('Report updated successfully', 200, report).send(res);
  }

  /**
   * Get patient reports
   * GET /api/reports/patients/:patientId
   */
  static async getPatientReports(req, res) {
    const reports = await ReportService.getPatientReports(req.params.patientId, req.query);
    return new SuccessResponse('Patient reports retrieved successfully', 200, reports).send(res);
  }

  /**
   * Get doctor reports
   * GET /api/reports/doctors/:doctorId
   */
  static async getDoctorReports(req, res) {
    const reports = await ReportService.getDoctorReports(req.params.doctorId, req.query);
    return new SuccessResponse('Doctor reports retrieved successfully', 200, reports).send(res);
  }

  /**
   * Generate report summary
   * GET /api/reports/:id/summary
   */
  static async generateReportSummary(req, res) {
    const summary = await ReportService.generateReportSummary(req.params.id);
    return new SuccessResponse('Report summary generated successfully', 200, summary).send(res);
  }

  static async createInsuranceDetails(req, res) {
    try {
      info('Creating insurance details report:', { name: req.body?.name });

      // Validate request body
      const { error, value } = insuranceDetailsSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const {
        name, type_car, accident_date, accident_time, accident_time_period, accident_location,
        accident_type, accident_description, accident_awareness, accident_appearance_of_ambulance,
        airbag_deployment, seatbelt_use, police_appearance, any_past_accidents, lost_work_yes_no,
        lost_work_dates, pregnant, children_info, covered, insurance_type
      } = value;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Insert insurance details report
        const reportResult = await client.query(
          `INSERT INTO insurance_details_reports (
            name, type_car, accident_date, accident_time, accident_time_period, accident_location,
            accident_type, accident_description, accident_awareness, accident_appearance_of_ambulance,
            airbag_deployment, seatbelt_use, police_appearance, any_past_accidents, lost_work_yes_no,
            lost_work_dates, pregnant, children_info, covered, insurance_type, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 'active', NOW(), NOW())
          RETURNING *`,
          [
            name, type_car, accident_date, accident_time, accident_time_period, accident_location,
            accident_type, accident_description, accident_awareness, accident_appearance_of_ambulance,
            airbag_deployment, seatbelt_use, police_appearance, any_past_accidents, lost_work_yes_no,
            lost_work_dates, pregnant, children_info, covered, insurance_type
          ]
        );

        const report = reportResult.rows[0];

        info('Insurance details report created successfully:', { id: report.id });

        const response = new SuccessResponse('Insurance details report created successfully', 201, {
          report: {
            id: report.id,
            name: report.name,
            type_car: report.type_car,
            accident_date: report.accident_date,
            accident_time: report.accident_time,
            accident_time_period: report.accident_time_period,
            accident_location: report.accident_location,
            accident_type: report.accident_type,
            accident_description: report.accident_description,
            accident_awareness: report.accident_awareness,
            accident_appearance_of_ambulance: report.accident_appearance_of_ambulance,
            airbag_deployment: report.airbag_deployment,
            seatbelt_use: report.seatbelt_use,
            police_appearance: report.police_appearance,
            any_past_accidents: report.any_past_accidents,
            lost_work_yes_no: report.lost_work_yes_no,
            lost_work_dates: report.lost_work_dates,
            pregnant: report.pregnant,
            children_info: report.children_info,
            covered: report.covered,
            insurance_type: report.insurance_type,
            status: report.status,
            created_at: report.created_at,
            updated_at: report.updated_at
          }
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      logError('Insurance details report creation error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during insurance details report creation', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async createPainEvaluation(req, res) {
    try {
      info('Creating pain evaluation report:', { name: req.body?.name });

      // Validate request body
      const { error, value } = painEvaluationSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const { name, pain_evaluations } = value;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Insert pain evaluation report
        const reportResult = await client.query(
          `INSERT INTO pain_evaluation_reports (
            name, pain_evaluations, status, created_at, updated_at
          ) VALUES ($1, $2, 'active', NOW(), NOW())
          RETURNING *`,
          [name, JSON.stringify(pain_evaluations)]
        );

        const report = reportResult.rows[0];

        info('Pain evaluation report created successfully:', { id: report.id });

        const response = new SuccessResponse('Pain evaluation report created successfully', 201, {
          report: {
            id: report.id,
            name: report.name,
            pain_evaluations: report.pain_evaluations,
            status: report.status,
            created_at: report.created_at,
            updated_at: report.updated_at
          }
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      logError('Pain evaluation report creation error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during pain evaluation report creation', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async createDetailedDescription(req, res) {
    try {
      info('Creating detailed description report:', { name: req.body?.name });

      // Validate request body
      const { error, value } = detailedDescriptionSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const { name, symptom_details, main_complaints, previous_healthcare } = value;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Insert detailed description report
        const reportResult = await client.query(
          `INSERT INTO detailed_description_reports (
            name, symptom_details, main_complaints, previous_healthcare, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, 'active', NOW(), NOW())
          RETURNING *`,
          [name, symptom_details, main_complaints, previous_healthcare]
        );

        const report = reportResult.rows[0];

        info('Detailed description report created successfully:', { id: report.id });

        const response = new SuccessResponse('Detailed description report created successfully', 201, {
          report: {
            id: report.id,
            name: report.name,
            symptom_details: report.symptom_details,
            main_complaints: report.main_complaints,
            previous_healthcare: report.previous_healthcare,
            status: report.status,
            created_at: report.created_at,
            updated_at: report.updated_at
          }
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      logError('Detailed description report creation error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during detailed description report creation', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async createWorkImpact(req, res) {
    try {
      info('Creating work impact report:', { name: req.body?.name });

      // Validate request body
      const { error, value } = workImpactSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const { name, work_status, days_off_work, work_limitations, return_to_work_date, work_accommodations } = value;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Insert work impact report
        const reportResult = await client.query(
          `INSERT INTO work_impact_reports (
            name, work_status, days_off_work, work_limitations, return_to_work_date, work_accommodations, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, 'active', NOW(), NOW())
          RETURNING *`,
          [name, work_status, days_off_work, work_limitations, return_to_work_date, work_accommodations]
        );

        const report = reportResult.rows[0];

        info('Work impact report created successfully:', { id: report.id });

        const response = new SuccessResponse('Work impact report created successfully', 201, {
          report: {
            id: report.id,
            name: report.name,
            work_status: report.work_status,
            days_off_work: report.days_off_work,
            work_limitations: report.work_limitations,
            return_to_work_date: report.return_to_work_date,
            work_accommodations: report.work_accommodations,
            status: report.status,
            created_at: report.created_at,
            updated_at: report.updated_at
          }
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      logError('Work impact report creation error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during work impact report creation', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async createHealthCondition(req, res) {
    try {
      info('Creating health condition report:', { name: req.body?.name });

      // Validate request body
      const { error, value } = healthConditionSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const {
        name, has_condition, condition_details, has_surgical_history, surgical_history_details,
        medication, medication_names, currently_working, work_times, work_hours_per_day,
        work_days_per_week, job_description, last_menstrual_period, is_pregnant_now, weeks_pregnant
      } = value;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Insert health condition report
        const reportResult = await client.query(
          `INSERT INTO health_condition_reports (
            name, has_condition, condition_details, has_surgical_history, surgical_history_details,
            medication, medication_names, currently_working, work_times, work_hours_per_day,
            work_days_per_week, job_description, last_menstrual_period, is_pregnant_now, weeks_pregnant,
            status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'active', NOW(), NOW())
          RETURNING *`,
          [
            name, has_condition, condition_details, has_surgical_history, surgical_history_details,
            medication, medication_names, currently_working, work_times, work_hours_per_day,
            work_days_per_week, job_description, last_menstrual_period, is_pregnant_now, weeks_pregnant
          ]
        );

        const report = reportResult.rows[0];

        info('Health condition report created successfully:', { id: report.id });

        const response = new SuccessResponse('Health condition report created successfully', 201, {
          report: {
            id: report.id,
            name: report.name,
            has_condition: report.has_condition,
            condition_details: report.condition_details,
            has_surgical_history: report.has_surgical_history,
            surgical_history_details: report.surgical_history_details,
            medication: report.medication,
            medication_names: report.medication_names,
            currently_working: report.currently_working,
            work_times: report.work_times,
            work_hours_per_day: report.work_hours_per_day,
            work_days_per_week: report.work_days_per_week,
            job_description: report.job_description,
            last_menstrual_period: report.last_menstrual_period,
            is_pregnant_now: report.is_pregnant_now,
            weeks_pregnant: report.weeks_pregnant,
            status: report.status,
            created_at: report.created_at,
            updated_at: report.updated_at
          }
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      logError('Health condition report creation error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during health condition report creation', 500, '5000');
        errorResponse.send(res);
      }
    }
  }
}

module.exports = ReportController; 