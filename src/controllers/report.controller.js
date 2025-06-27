const { SuccessResponse, ErrorResponse } = require('../utils/httpResponses');
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

class ReportController {
  static async createPatientIntake(req, res) {
    try {
      console.log('Creating patient intake report:', { name: req.body?.name });

      // Validate request body
      const { error, value } = patientIntakeSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const {
        name, first_name, middle_name, last_name, date_of_birth, address, city, state, zip_code,
        home_phone, work_phone, cell_phone, email, ssn, emergency_contact_name,
        emergency_contact_phone, emergency_contact_relationship
      } = value;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Insert patient intake report
        const reportResult = await client.query(
          `INSERT INTO patient_intake_reports (
            name, first_name, middle_name, last_name, date_of_birth, address, city, state, zip_code,
            home_phone, work_phone, cell_phone, email, ssn, emergency_contact_name,
            emergency_contact_phone, emergency_contact_relationship, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'active', NOW(), NOW())
          RETURNING *`,
          [
            name, first_name, middle_name, last_name, date_of_birth, address, city, state, zip_code,
            home_phone, work_phone, cell_phone, email, ssn, emergency_contact_name,
            emergency_contact_phone, emergency_contact_relationship
          ]
        );

        const report = reportResult.rows[0];

        console.log('Patient intake report created successfully:', { id: report.id });

        const response = new SuccessResponse('Patient intake report created successfully', 201, {
          report: {
            id: report.id,
            name: report.name,
            first_name: report.first_name,
            middle_name: report.middle_name,
            last_name: report.last_name,
            date_of_birth: report.date_of_birth,
            address: report.address,
            city: report.city,
            state: report.state,
            zip_code: report.zip_code,
            home_phone: report.home_phone,
            work_phone: report.work_phone,
            cell_phone: report.cell_phone,
            email: report.email,
            ssn: report.ssn,
            emergency_contact_name: report.emergency_contact_name,
            emergency_contact_phone: report.emergency_contact_phone,
            emergency_contact_relationship: report.emergency_contact_relationship,
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
      console.error('Patient intake report creation error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during patient intake report creation', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async createInsuranceDetails(req, res) {
    try {
      console.log('Creating insurance details report:', { name: req.body?.name });

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

        console.log('Insurance details report created successfully:', { id: report.id });

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
      console.error('Insurance details report creation error:', error);
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
      console.log('Creating pain evaluation report:', { name: req.body?.name });

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

        console.log('Pain evaluation report created successfully:', { id: report.id });

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
      console.error('Pain evaluation report creation error:', error);
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
      console.log('Creating detailed description report:', { name: req.body?.name });

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

        console.log('Detailed description report created successfully:', { id: report.id });

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
      console.error('Detailed description report creation error:', error);
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
      console.log('Creating work impact report:', { name: req.body?.name });

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

        console.log('Work impact report created successfully:', { id: report.id });

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
      console.error('Work impact report creation error:', error);
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
      console.log('Creating health condition report:', { name: req.body?.name });

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

        console.log('Health condition report created successfully:', { id: report.id });

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
      console.error('Health condition report creation error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during health condition report creation', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async createDoctorInitialReport(req, res) {
    try {
      console.log('Creating doctor initial report:', { patient_id: req.body?.patient_id });

      // Validate request body
      const { error, value } = doctorInitialReportSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const {
        patient_id, chief_complaint, history_of_present_illness, physical_examination,
        assessment, treatment, plan
      } = value;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Verify patient exists
        const patientCheck = await client.query(
          'SELECT id, first_name, last_name FROM patients WHERE id = $1 AND status = $2',
          [patient_id, 'active']
        );

        if (patientCheck.rows.length === 0) {
          throw new ErrorResponse('Patient not found', 404, '4041');
        }

        const patient = patientCheck.rows[0];

        // Insert doctor initial report
        const reportResult = await client.query(
          `INSERT INTO doctor_initial_reports (
            patient_id, chief_complaint, history_of_present_illness, physical_examination,
            assessment, treatment, plan, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', NOW(), NOW())
          RETURNING *`,
          [patient_id, chief_complaint, history_of_present_illness, physical_examination, assessment, treatment, plan]
        );

        const report = reportResult.rows[0];

        console.log('Doctor initial report created successfully:', { id: report.id, patient_id });

        const response = new SuccessResponse('Doctor initial report created successfully', 201, {
          report: {
            id: report.id,
            patient_id: report.patient_id,
            patient_name: `${patient.first_name} ${patient.last_name}`,
            chief_complaint: report.chief_complaint,
            history_of_present_illness: report.history_of_present_illness,
            physical_examination: report.physical_examination,
            assessment: report.assessment,
            treatment: report.treatment,
            plan: report.plan,
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
      console.error('Doctor initial report creation error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during doctor initial report creation', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async getAllReports(req, res) {
    try {
      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Get all report types
        const [
          patientIntakeReports,
          insuranceDetailsReports,
          painEvaluationReports,
          detailedDescriptionReports,
          workImpactReports,
          healthConditionReports,
          doctorInitialReports
        ] = await Promise.all([
          client.query('SELECT * FROM patient_intake_reports WHERE status = $1 ORDER BY created_at DESC', ['active']),
          client.query('SELECT * FROM insurance_details_reports WHERE status = $1 ORDER BY created_at DESC', ['active']),
          client.query('SELECT * FROM pain_evaluation_reports WHERE status = $1 ORDER BY created_at DESC', ['active']),
          client.query('SELECT * FROM detailed_description_reports WHERE status = $1 ORDER BY created_at DESC', ['active']),
          client.query('SELECT * FROM work_impact_reports WHERE status = $1 ORDER BY created_at DESC', ['active']),
          client.query('SELECT * FROM health_condition_reports WHERE status = $1 ORDER BY created_at DESC', ['active']),
          client.query('SELECT * FROM doctor_initial_reports WHERE status = $1 ORDER BY created_at DESC', ['active'])
        ]);

        const response = new SuccessResponse('Reports retrieved successfully', 200, {
          reports: {
            patient_intake: patientIntakeReports.rows,
            insurance_details: insuranceDetailsReports.rows,
            pain_evaluation: painEvaluationReports.rows,
            detailed_description: detailedDescriptionReports.rows,
            work_impact: workImpactReports.rows,
            health_condition: healthConditionReports.rows,
            doctor_initial: doctorInitialReports.rows
          },
          total_count: {
            patient_intake: patientIntakeReports.rows.length,
            insurance_details: insuranceDetailsReports.rows.length,
            pain_evaluation: painEvaluationReports.rows.length,
            detailed_description: detailedDescriptionReports.rows.length,
            work_impact: workImpactReports.rows.length,
            health_condition: healthConditionReports.rows.length,
            doctor_initial: doctorInitialReports.rows.length
          }
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Get reports error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error while retrieving reports', 500, '5000');
        errorResponse.send(res);
      }
    }
  }
}

module.exports = ReportController; 