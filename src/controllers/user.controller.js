const { SuccessResponse, ErrorResponse } = require('../utils/httpResponses');
const { getPostgreSQLPool } = require('../config/database');
const { patientCreateSchema, patientUpdateSchema, clinicalNotesSchema, vitalsSchema } = require('../validators');

class UserController {
  static async createPatient(req, res) {
    try {
      console.log('Creating patient:', { email: req.body?.email });

      // Validate request body
      const { error, value } = patientCreateSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const { 
        first_name, middle_name, last_name, email, phone_number, date_of_birth,
        gender, marriage_status, race, address, emergency_contact, insurance_info, medical_history
      } = value;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Begin transaction
        await client.query('BEGIN');

        // Check if patient already exists by email
        const existingPatient = await client.query(
          'SELECT id FROM patients WHERE email = $1',
          [email]
        );

        if (existingPatient.rows.length > 0) {
          throw new ErrorResponse('Patient with this email already exists', 409, '4091');
        }

        // Calculate age if date_of_birth is provided
        let age = null;
        if (date_of_birth) {
          const today = new Date();
          const birthDate = new Date(date_of_birth);
          age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
        }

        // Insert patient
        const patientResult = await client.query(
          `INSERT INTO patients (
            first_name, middle_name, last_name, email, phone, date_of_birth, age,
            gender, marriage_status, race, street, city, state, zip,
            emergency_contact_name, emergency_contact_phone, emergency_contact_relationship,
            insurance_info, medical_history, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'active', NOW(), NOW())
          RETURNING *`,
          [
            first_name, middle_name, last_name, email, phone_number, date_of_birth, age,
            gender, marriage_status, race, 
            address?.street, address?.city, address?.state, address?.zip_code,
            emergency_contact?.name, emergency_contact?.phone_number, emergency_contact?.relationship,
            JSON.stringify(insurance_info || {}), JSON.stringify(medical_history || {})
          ]
        );

        const patient = patientResult.rows[0];

        // Commit transaction
        await client.query('COMMIT');

        console.log('Patient created successfully:', { id: patient.id, email: patient.email });

        const response = new SuccessResponse('Patient created successfully', 201, {
          patient: {
            id: patient.id,
            first_name: patient.first_name,
            middle_name: patient.middle_name,
            last_name: patient.last_name,
            email: patient.email,
            phone_number: patient.phone,
            date_of_birth: patient.date_of_birth,
            age: patient.age,
            gender: patient.gender,
            marriage_status: patient.marriage_status,
            race: patient.race,
            address: {
              street: patient.street,
              city: patient.city,
              state: patient.state,
              zip_code: patient.zip
            },
            emergency_contact: {
              name: patient.emergency_contact_name,
              phone_number: patient.emergency_contact_phone,
              relationship: patient.emergency_contact_relationship
            },
            insurance_info: patient.insurance_info,
            medical_history: patient.medical_history,
            status: patient.status,
            created_at: patient.created_at,
            updated_at: patient.updated_at
          }
        });

        response.send(res);

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Patient creation error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during patient creation', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async getAllPatients(req, res) {
    try {
      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        const patientsResult = await client.query(
          'SELECT * FROM patients WHERE status = $1 ORDER BY created_at DESC',
          ['active']
        );

        const patients = patientsResult.rows.map(patient => ({
          id: patient.id,
          first_name: patient.first_name,
          middle_name: patient.middle_name,
          last_name: patient.last_name,
          email: patient.email,
          phone_number: patient.phone,
          date_of_birth: patient.date_of_birth,
          age: patient.age,
          gender: patient.gender,
          marriage_status: patient.marriage_status,
          race: patient.race,
          address: {
            street: patient.street,
            city: patient.city,
            state: patient.state,
            zip_code: patient.zip
          },
          emergency_contact: {
            name: patient.emergency_contact_name,
            phone_number: patient.emergency_contact_phone,
            relationship: patient.emergency_contact_relationship
          },
          insurance_info: patient.insurance_info,
          medical_history: patient.medical_history,
          status: patient.status,
          created_at: patient.created_at,
          updated_at: patient.updated_at
        }));

        const response = new SuccessResponse('Patients retrieved successfully', 200, {
          patients,
          total_count: patients.length
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Get patients error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error while retrieving patients', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async getPatientById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        throw new ErrorResponse('Invalid patient ID', 400, '4001');
      }

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        const patientResult = await client.query(
          'SELECT * FROM patients WHERE id = $1 AND status = $2',
          [parseInt(id), 'active']
        );

        if (patientResult.rows.length === 0) {
          throw new ErrorResponse('Patient not found', 404, '4041');
        }

        const patient = patientResult.rows[0];

        const response = new SuccessResponse('Patient retrieved successfully', 200, {
          patient: {
            id: patient.id,
            first_name: patient.first_name,
            middle_name: patient.middle_name,
            last_name: patient.last_name,
            email: patient.email,
            phone_number: patient.phone,
            date_of_birth: patient.date_of_birth,
            age: patient.age,
            gender: patient.gender,
            marriage_status: patient.marriage_status,
            race: patient.race,
            address: {
              street: patient.street,
              city: patient.city,
              state: patient.state,
              zip_code: patient.zip
            },
            emergency_contact: {
              name: patient.emergency_contact_name,
              phone_number: patient.emergency_contact_phone,
              relationship: patient.emergency_contact_relationship
            },
            insurance_info: patient.insurance_info,
            medical_history: patient.medical_history,
            status: patient.status,
            created_at: patient.created_at,
            updated_at: patient.updated_at
          }
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Get patient error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error while retrieving patient', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async createClinicalNotes(req, res) {
    try {
      console.log('Creating clinical notes for patient:', req.body?.patient_id);

      // Validate request body
      const { error, value } = clinicalNotesSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const {
        patient_id, appointment_id, note_type, chief_complaint, history_of_present_illness,
        physical_examination, assessment, treatment, plan, recommendations, 
        duration_minutes, doctor_id, doctor_name, status
      } = value;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Verify patient exists
        const patientCheck = await client.query(
          'SELECT id FROM patients WHERE id = $1 AND status = $2',
          [patient_id, 'active']
        );

        if (patientCheck.rows.length === 0) {
          throw new ErrorResponse('Patient not found', 404, '4041');
        }

        // Insert clinical notes
        const notesResult = await client.query(
          `INSERT INTO clinical_notes (
            patient_id, appointment_id, note_type, chief_complaint, history_of_present_illness,
            physical_examination, assessment, treatment, plan, recommendations,
            duration_minutes, doctor_id, doctor_name, status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
          RETURNING *`,
          [
            patient_id, appointment_id, note_type, chief_complaint, history_of_present_illness,
            JSON.stringify(physical_examination || {}), assessment, treatment, plan,
            JSON.stringify(recommendations || []), duration_minutes, doctor_id, doctor_name, status
          ]
        );

        const notes = notesResult.rows[0];

        console.log('Clinical notes created successfully:', { id: notes.id, patient_id });

        const response = new SuccessResponse('Clinical notes created successfully', 201, {
          notes: {
            id: notes.id,
            patient_id: notes.patient_id,
            appointment_id: notes.appointment_id,
            note_type: notes.note_type,
            chief_complaint: notes.chief_complaint,
            history_of_present_illness: notes.history_of_present_illness,
            physical_examination: notes.physical_examination,
            assessment: notes.assessment,
            treatment: notes.treatment,
            plan: notes.plan,
            recommendations: notes.recommendations,
            duration_minutes: notes.duration_minutes,
            doctor_id: notes.doctor_id,
            doctor_name: notes.doctor_name,
            status: notes.status,
            created_at: notes.created_at,
            updated_at: notes.updated_at
          }
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Clinical notes creation error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during clinical notes creation', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async createVitals(req, res) {
    try {
      console.log('Recording vitals for patient:', req.body?.patient_id);

      // Validate request body
      const { error, value } = vitalsSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const {
        patient_id, appointment_id, blood_pressure, heart_rate, temperature,
        weight, height, pain_level, pain_location, recorded_by, notes
      } = value;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Verify patient exists
        const patientCheck = await client.query(
          'SELECT id FROM patients WHERE id = $1 AND status = $2',
          [patient_id, 'active']
        );

        if (patientCheck.rows.length === 0) {
          throw new ErrorResponse('Patient not found', 404, '4041');
        }

        // Insert vitals
        const vitalsResult = await client.query(
          `INSERT INTO vitals (
            patient_id, appointment_id, systolic_bp, diastolic_bp, heart_rate, temperature,
            weight, height, pain_level, pain_location, recorded_by, notes, recorded_at, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW(), NOW())
          RETURNING *`,
          [
            patient_id, appointment_id, blood_pressure?.systolic, blood_pressure?.diastolic,
            heart_rate, temperature, weight, height, pain_level, pain_location, recorded_by, notes
          ]
        );

        const vitals = vitalsResult.rows[0];

        console.log('Vitals recorded successfully:', { id: vitals.id, patient_id });

        const response = new SuccessResponse('Vitals recorded successfully', 201, {
          vitals: {
            id: vitals.id,
            patient_id: vitals.patient_id,
            appointment_id: vitals.appointment_id,
            blood_pressure: {
              systolic: vitals.systolic_bp,
              diastolic: vitals.diastolic_bp
            },
            heart_rate: vitals.heart_rate,
            temperature: vitals.temperature,
            weight: vitals.weight,
            height: vitals.height,
            pain_level: vitals.pain_level,
            pain_location: vitals.pain_location,
            recorded_by: vitals.recorded_by,
            notes: vitals.notes,
            recorded_at: vitals.recorded_at,
            created_at: vitals.created_at,
            updated_at: vitals.updated_at
          }
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Vitals recording error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during vitals recording', 500, '5000');
        errorResponse.send(res);
      }
    }
  }
}

module.exports = UserController; 