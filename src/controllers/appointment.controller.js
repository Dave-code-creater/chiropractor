const { SuccessResponse, ErrorResponse } = require('../utils/httpResponses');
const { getPostgreSQLPool } = require('../config/database');
const { appointmentCreateSchema, quickScheduleSchema, appointmentUpdateSchema } = require('../validators');

class AppointmentController {
  static async createAppointment(req, res) {
    try {
      console.log('Creating appointment:', { doctor_id: req.body?.doctor_id, date: req.body?.appointment_date });

      // Validate request body
      const { error, value } = appointmentCreateSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const {
        doctor_id, patient_id, patient_name, patient_phone, patient_email,
        appointment_date, appointment_time, appointment_type, reason_for_visit,
        additional_notes, duration_minutes, status
      } = value;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Begin transaction
        await client.query('BEGIN');

        // Verify doctor exists
        const doctorCheck = await client.query(
          'SELECT id, first_name, last_name FROM doctors WHERE id = $1 AND status = $2',
          [doctor_id, 'active']
        );

        if (doctorCheck.rows.length === 0) {
          throw new ErrorResponse('Doctor not found', 404, '4041');
        }

        const doctor = doctorCheck.rows[0];

        // If patient_id is provided, verify patient exists
        let patient = null;
        if (patient_id) {
          const patientCheck = await client.query(
            'SELECT id, first_name, last_name, email, phone FROM patients WHERE id = $1 AND status = $2',
            [patient_id, 'active']
          );

          if (patientCheck.rows.length === 0) {
            throw new ErrorResponse('Patient not found', 404, '4042');
          }

          patient = patientCheck.rows[0];
        }

        // Parse date and time
        let parsedDate;
        let parsedTime;

        // Handle different date formats
        if (appointment_date.includes(',')) {
          // Format: "Thursday, June 26, 2025"
          const dateStr = appointment_date.replace(/^[A-Za-z]+,\s*/, ''); // Remove day of week
          parsedDate = new Date(dateStr);
        } else {
          // Format: "2025-06-26"
          parsedDate = new Date(appointment_date);
        }

        // Handle different time formats
        if (appointment_time.includes('AM') || appointment_time.includes('PM')) {
          // Format: "11:30 AM"
          const [time, period] = appointment_time.split(' ');
          const [hours, minutes] = time.split(':');
          let hour24 = parseInt(hours);
          
          if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
          } else if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
          }
          
          parsedTime = `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
        } else {
          // Format: "14:30"
          parsedTime = appointment_time.includes(':') ? `${appointment_time}:00` : appointment_time;
        }

        // Create full datetime
        const appointmentDateTime = new Date(parsedDate);
        const [hours, minutes] = parsedTime.split(':');
        appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Check for scheduling conflicts
        const conflictCheck = await client.query(
          `SELECT id FROM appointments 
           WHERE doctor_id = $1 
           AND appointment_datetime = $2 
           AND status NOT IN ('cancelled', 'no-show')`,
          [doctor_id, appointmentDateTime]
        );

        if (conflictCheck.rows.length > 0) {
          throw new ErrorResponse('Doctor is not available at this time slot', 409, '4093');
        }

        // Insert appointment
        const appointmentResult = await client.query(
          `INSERT INTO appointments (
            doctor_id, patient_id, patient_name, patient_phone, patient_email,
            appointment_datetime, appointment_date, appointment_time, appointment_type,
            reason_for_visit, additional_notes, duration_minutes, status,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
          RETURNING *`,
          [
            doctor_id, patient_id, 
            patient_name || (patient ? `${patient.first_name} ${patient.last_name}` : null),
            patient_phone || (patient ? patient.phone : null),
            patient_email || (patient ? patient.email : null),
            appointmentDateTime, appointment_date, appointment_time, appointment_type,
            reason_for_visit, additional_notes, duration_minutes, status
          ]
        );

        const appointment = appointmentResult.rows[0];

        // Commit transaction
        await client.query('COMMIT');

        console.log('Appointment created successfully:', { 
          id: appointment.id, 
          doctor_id: appointment.doctor_id,
          datetime: appointment.appointment_datetime
        });

        const response = new SuccessResponse('Appointment booked successfully', 201, {
          appointment: {
            id: appointment.id,
            doctor_id: appointment.doctor_id,
            doctor_name: `${doctor.first_name} ${doctor.last_name}`,
            patient_id: appointment.patient_id,
            patient_name: appointment.patient_name,
            patient_phone: appointment.patient_phone,
            patient_email: appointment.patient_email,
            appointment_datetime: appointment.appointment_datetime,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            appointment_type: appointment.appointment_type,
            reason_for_visit: appointment.reason_for_visit,
            additional_notes: appointment.additional_notes,
            duration_minutes: appointment.duration_minutes,
            status: appointment.status,
            created_at: appointment.created_at,
            updated_at: appointment.updated_at
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
      console.error('Appointment creation error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during appointment creation', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async quickSchedule(req, res) {
    try {
      console.log('Quick scheduling appointment:', { patient_name: req.body?.patient_name });

      // Validate request body
      const { error, value } = quickScheduleSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const {
        patient_name, patient_phone, patient_email, appointment_date, appointment_time,
        appointment_type, reason, notes, doctor_id, duration_minutes
      } = value;

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Begin transaction
        await client.query('BEGIN');

        // If no doctor_id provided, assign to first available doctor
        let selectedDoctorId = doctor_id;
        let doctor;

        if (!selectedDoctorId) {
          const doctorResult = await client.query(
            'SELECT id, first_name, last_name FROM doctors WHERE status = $1 ORDER BY id LIMIT 1',
            ['active']
          );

          if (doctorResult.rows.length === 0) {
            throw new ErrorResponse('No doctors available', 404, '4041');
          }

          doctor = doctorResult.rows[0];
          selectedDoctorId = doctor.id;
        } else {
          // Verify specified doctor exists
          const doctorCheck = await client.query(
            'SELECT id, first_name, last_name FROM doctors WHERE id = $1 AND status = $2',
            [selectedDoctorId, 'active']
          );

          if (doctorCheck.rows.length === 0) {
            throw new ErrorResponse('Doctor not found', 404, '4041');
          }

          doctor = doctorCheck.rows[0];
        }

        // Create full datetime
        const appointmentDateTime = new Date(appointment_date);
        const [hours, minutes] = appointment_time.split(':');
        appointmentDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Check for scheduling conflicts
        const conflictCheck = await client.query(
          `SELECT id FROM appointments 
           WHERE doctor_id = $1 
           AND appointment_datetime = $2 
           AND status NOT IN ('cancelled', 'no-show')`,
          [selectedDoctorId, appointmentDateTime]
        );

        if (conflictCheck.rows.length > 0) {
          throw new ErrorResponse('Doctor is not available at this time slot', 409, '4093');
        }

        // Format date and time for display
        const displayDate = appointment_date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const displayTime = appointmentDateTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });

        // Insert appointment
        const appointmentResult = await client.query(
          `INSERT INTO appointments (
            doctor_id, patient_name, patient_phone, patient_email,
            appointment_datetime, appointment_date, appointment_time, appointment_type,
            reason_for_visit, additional_notes, duration_minutes, status,
            created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'scheduled', NOW(), NOW())
          RETURNING *`,
          [
            selectedDoctorId, patient_name, patient_phone, patient_email,
            appointmentDateTime, displayDate, displayTime, appointment_type,
            reason, notes, duration_minutes
          ]
        );

        const appointment = appointmentResult.rows[0];

        // Commit transaction
        await client.query('COMMIT');

        console.log('Quick appointment scheduled successfully:', { 
          id: appointment.id, 
          patient_name: appointment.patient_name,
          doctor_id: appointment.doctor_id
        });

        const response = new SuccessResponse('Appointment scheduled successfully', 201, {
          appointment: {
            id: appointment.id,
            doctor_id: appointment.doctor_id,
            doctor_name: `${doctor.first_name} ${doctor.last_name}`,
            patient_name: appointment.patient_name,
            patient_phone: appointment.patient_phone,
            patient_email: appointment.patient_email,
            appointment_datetime: appointment.appointment_datetime,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            appointment_type: appointment.appointment_type,
            reason_for_visit: appointment.reason_for_visit,
            additional_notes: appointment.additional_notes,
            duration_minutes: appointment.duration_minutes,
            status: appointment.status,
            created_at: appointment.created_at,
            updated_at: appointment.updated_at
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
      console.error('Quick schedule error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during quick scheduling', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async getAllAppointments(req, res) {
    try {
      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Get appointments with doctor information
        const appointmentsResult = await client.query(
          `SELECT a.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name
           FROM appointments a
           LEFT JOIN doctors d ON a.doctor_id = d.id
           WHERE a.status != 'cancelled'
           ORDER BY a.appointment_datetime ASC`
        );

        const appointments = appointmentsResult.rows.map(appointment => ({
          id: appointment.id,
          doctor_id: appointment.doctor_id,
          doctor_name: appointment.doctor_first_name && appointment.doctor_last_name 
            ? `${appointment.doctor_first_name} ${appointment.doctor_last_name}` 
            : null,
          patient_id: appointment.patient_id,
          patient_name: appointment.patient_name,
          patient_phone: appointment.patient_phone,
          patient_email: appointment.patient_email,
          appointment_datetime: appointment.appointment_datetime,
          appointment_date: appointment.appointment_date,
          appointment_time: appointment.appointment_time,
          appointment_type: appointment.appointment_type,
          reason_for_visit: appointment.reason_for_visit,
          additional_notes: appointment.additional_notes,
          duration_minutes: appointment.duration_minutes,
          status: appointment.status,
          created_at: appointment.created_at,
          updated_at: appointment.updated_at
        }));

        const response = new SuccessResponse('Appointments retrieved successfully', 200, {
          appointments,
          total_count: appointments.length
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Get appointments error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error while retrieving appointments', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async getAppointmentById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        throw new ErrorResponse('Invalid appointment ID', 400, '4001');
      }

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        const appointmentResult = await client.query(
          `SELECT a.*, d.first_name as doctor_first_name, d.last_name as doctor_last_name,
                  p.first_name as patient_first_name, p.last_name as patient_last_name
           FROM appointments a
           LEFT JOIN doctors d ON a.doctor_id = d.id
           LEFT JOIN patients p ON a.patient_id = p.id
           WHERE a.id = $1`,
          [parseInt(id)]
        );

        if (appointmentResult.rows.length === 0) {
          throw new ErrorResponse('Appointment not found', 404, '4041');
        }

        const appointment = appointmentResult.rows[0];

        const response = new SuccessResponse('Appointment retrieved successfully', 200, {
          appointment: {
            id: appointment.id,
            doctor_id: appointment.doctor_id,
            doctor_name: appointment.doctor_first_name && appointment.doctor_last_name 
              ? `${appointment.doctor_first_name} ${appointment.doctor_last_name}` 
              : null,
            patient_id: appointment.patient_id,
            patient_name: appointment.patient_name || (appointment.patient_first_name && appointment.patient_last_name 
              ? `${appointment.patient_first_name} ${appointment.patient_last_name}` 
              : null),
            patient_phone: appointment.patient_phone,
            patient_email: appointment.patient_email,
            appointment_datetime: appointment.appointment_datetime,
            appointment_date: appointment.appointment_date,
            appointment_time: appointment.appointment_time,
            appointment_type: appointment.appointment_type,
            reason_for_visit: appointment.reason_for_visit,
            additional_notes: appointment.additional_notes,
            duration_minutes: appointment.duration_minutes,
            status: appointment.status,
            created_at: appointment.created_at,
            updated_at: appointment.updated_at
          }
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Get appointment error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error while retrieving appointment', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async updateAppointment(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        throw new ErrorResponse('Invalid appointment ID', 400, '4001');
      }

      // Validate request body
      const { error, value } = appointmentUpdateSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Begin transaction
        await client.query('BEGIN');

        // Check if appointment exists
        const existingAppointment = await client.query(
          'SELECT * FROM appointments WHERE id = $1',
          [parseInt(id)]
        );

        if (existingAppointment.rows.length === 0) {
          throw new ErrorResponse('Appointment not found', 404, '4041');
        }

        // Build update query dynamically
        const updateFields = [];
        const updateValues = [];
        let paramIndex = 1;

        Object.keys(value).forEach(key => {
          if (value[key] !== undefined) {
            updateFields.push(`${key} = $${paramIndex}`);
            updateValues.push(value[key]);
            paramIndex++;
          }
        });

        if (updateFields.length === 0) {
          throw new ErrorResponse('No valid fields to update', 400, '4001');
        }

        // Add updated_at
        updateFields.push(`updated_at = NOW()`);

        // Update appointment
        const updateQuery = `
          UPDATE appointments 
          SET ${updateFields.join(', ')}
          WHERE id = $${paramIndex}
          RETURNING *
        `;
        updateValues.push(parseInt(id));

        const updatedAppointment = await client.query(updateQuery, updateValues);

        // Commit transaction
        await client.query('COMMIT');

        console.log('Appointment updated successfully:', { id: parseInt(id) });

        const response = new SuccessResponse('Appointment updated successfully', 200, {
          appointment: updatedAppointment.rows[0]
        });

        response.send(res);

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Update appointment error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during appointment update', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async cancelAppointment(req, res) {
    try {
      const { id } = req.params;
      
      if (!id || isNaN(parseInt(id))) {
        throw new ErrorResponse('Invalid appointment ID', 400, '4001');
      }

      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        const cancelResult = await client.query(
          'UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
          ['cancelled', parseInt(id)]
        );

        if (cancelResult.rows.length === 0) {
          throw new ErrorResponse('Appointment not found', 404, '4041');
        }

        console.log('Appointment cancelled successfully:', { id: parseInt(id) });

        const response = new SuccessResponse('Appointment cancelled successfully', 200, {
          appointment: cancelResult.rows[0]
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Cancel appointment error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during appointment cancellation', 500, '5000');
        errorResponse.send(res);
      }
    }
  }
}

module.exports = AppointmentController; 