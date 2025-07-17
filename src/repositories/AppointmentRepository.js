const BaseRepository = require('./BaseRepository');
const { api, error: logError, info } = require('../utils/logger');

/**
 * Appointment Repository
 * Handles all appointment-related database operations
 */
class AppointmentRepository extends BaseRepository {
  constructor() {
    super('appointments');
  }

  /**
   * Create a new appointment record
   * @param {Object} appointmentData - Appointment data
   * @returns {Object} Created appointment
   */
  async createAppointment(appointmentData) {
    try {
      const appointment = await this.create(appointmentData);
      api.info('Appointment created in repository:', { id: appointment.id });
      return appointment;
    } catch (error) {
      api.error('Error creating appointment in repository:', error);
      throw error;
    }
  }

  /**
   * Find appointment by ID
   * @param {number} appointmentId - Appointment ID
   * @returns {Object|null} Appointment or null
   */
  async findAppointmentById(appointmentId) {
    try {
      const appointment = await this.findById(appointmentId);
      return appointment;
    } catch (error) {
      api.error('Error finding appointment by ID:', error);
      throw error;
    }
  }

  /**
   * Update appointment record
   * @param {number} appointmentId - Appointment ID
   * @param {Object} updateData - Data to update
   * @returns {Object|null} Updated appointment or null
   */
  async updateAppointment(appointmentId, updateData) {
    try {
      const appointment = await this.updateById(appointmentId, updateData);
      return appointment;
    } catch (error) {
      api.error('Error updating appointment:', error);
      throw error;
    }
  }

  /**
   * Get appointments with filtering and pagination
   * @param {Object} conditions - Filter conditions
   * @param {Object} options - Pagination and ordering options
   * @returns {Array} Appointments
   */
  async getAppointmentsByConditions(conditions = {}, options = {}) {
    try {
      const { limit, offset, orderBy = 'appointment_datetime DESC' } = options;
      
      // Build where clause for complex conditions
      const whereConditions = {};
      
      if (conditions.doctor_id) whereConditions.doctor_id = conditions.doctor_id;
      if (conditions.patient_id) whereConditions.patient_id = conditions.patient_id;
      if (conditions.status) whereConditions.status = conditions.status;
      if (conditions.location) whereConditions.location = conditions.location;

      // Handle date range filtering
      let dateRangeClause = '';
      let dateRangeParams = [];
      if (conditions.date_range) {
        const { start_date, end_date } = conditions.date_range;
        if (start_date && end_date) {
          dateRangeClause = 'AND appointment_date BETWEEN $' + (Object.keys(whereConditions).length + 1) + ' AND $' + (Object.keys(whereConditions).length + 2);
          dateRangeParams = [start_date, end_date];
        } else if (start_date) {
          dateRangeClause = 'AND appointment_date >= $' + (Object.keys(whereConditions).length + 1);
          dateRangeParams = [start_date];
        } else if (end_date) {
          dateRangeClause = 'AND appointment_date <= $' + (Object.keys(whereConditions).length + 1);
          dateRangeParams = [end_date];
        }
      }

      const whereClause = this.buildWhereClause(whereConditions);
      const query = `
        SELECT a.*, 
               d.first_name as doctor_first_name, 
               d.last_name as doctor_last_name,
               d.specialization as doctor_specialization,
               d.phone_number as doctor_phone,
               d.email as doctor_email,
               p.first_name as patient_first_name, 
               p.last_name as patient_last_name,
               p.email as patient_email,
               p.phone as patient_phone
        FROM appointments a
        LEFT JOIN doctors d ON a.doctor_id = d.id
        LEFT JOIN patients p ON a.patient_id = p.id
        ${whereClause.clause}
        ${dateRangeClause}
        ORDER BY ${orderBy}
        ${limit ? `LIMIT ${limit}` : ''}
        ${offset ? `OFFSET ${offset}` : ''}
      `;

      const result = await this.query(query, [...whereClause.params, ...dateRangeParams]);
      return result.rows;
    } catch (error) {
      api.error('Error getting appointments by conditions:', error);
      throw error;
    }
  }

  /**
   * Count appointments by conditions
   * @param {Object} conditions - Filter conditions
   * @returns {number} Count of appointments
   */
  async countAppointmentsByConditions(conditions = {}) {
    try {
      const whereConditions = {};
      
      if (conditions.doctor_id) whereConditions.doctor_id = conditions.doctor_id;
      if (conditions.status) whereConditions.status = conditions.status;
      if (conditions.location) whereConditions.location = conditions.location;

      // Handle date range filtering
      let dateRangeClause = '';
      let dateRangeParams = [];
      if (conditions.date_range) {
        const { start_date, end_date } = conditions.date_range;
        if (start_date && end_date) {
          dateRangeClause = 'AND appointment_date BETWEEN $' + (Object.keys(whereConditions).length + 1) + ' AND $' + (Object.keys(whereConditions).length + 2);
          dateRangeParams = [start_date, end_date];
        } else if (start_date) {
          dateRangeClause = 'AND appointment_date >= $' + (Object.keys(whereConditions).length + 1);
          dateRangeParams = [start_date];
        } else if (end_date) {
          dateRangeClause = 'AND appointment_date <= $' + (Object.keys(whereConditions).length + 1);
          dateRangeParams = [end_date];
        }
      }

      const whereClause = this.buildWhereClause(whereConditions);
      const query = `
        SELECT COUNT(*) as count
        FROM appointments
        ${whereClause.clause}
        ${dateRangeClause}
      `;

      const result = await this.query(query, [...whereClause.params, ...dateRangeParams]);
      return parseInt(result.rows[0].count);
    } catch (error) {
      api.error('Error counting appointments by conditions:', error);
      throw error;
    }
  }

  /**
   * Check for scheduling conflicts
   * @param {number} doctorId - Doctor ID
   * @param {Date} appointmentDateTime - Appointment datetime
   * @param {number} excludeAppointmentId - Appointment ID to exclude from check
   * @returns {boolean} True if conflict exists
   */
  async checkSchedulingConflict(doctorId, appointmentDateTime, excludeAppointmentId = null) {
    try {
      const startTime = new Date(appointmentDateTime);
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000); // 30 minutes default

      let query = `
        SELECT COUNT(*) as count
        FROM appointments
        WHERE doctor_id = $1
        AND status NOT IN ('cancelled', 'no-show')
        AND appointment_datetime < $2
        AND appointment_datetime + INTERVAL '30 minutes' > $3
      `;
      
      let params = [doctorId, endTime, startTime];

      if (excludeAppointmentId) {
        query += ' AND id != $4';
        params.push(excludeAppointmentId);
      }

      const result = await this.query(query, params);
      return parseInt(result.rows[0].count) > 0;
    } catch (error) {
      api.error('Error checking scheduling conflict:', error);
      throw error;
    }
  }

  /**
   * Get doctor availability for a specific date
   * @param {number} doctorId - Doctor ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Array} Available time slots
   */
  async getDoctorAvailability(doctorId, date) {
    try {
      const query = `
        SELECT appointment_time
        FROM appointments
        WHERE doctor_id = $1
        AND appointment_date = $2
        AND status NOT IN ('cancelled', 'no-show')
        ORDER BY appointment_time
      `;

      const result = await this.query(query, [doctorId, date]);
      return result.rows;
    } catch (error) {
      api.error('Error getting doctor availability:', error);
      throw error;
    }
  }

  /**
   * Get appointments for a specific patient
   * @param {number} patientId - Patient ID
   * @param {Object} options - Query options
   * @returns {Array} Patient appointments
   */
  async getPatientAppointments(patientId, options = {}) {
    try {
      const { limit = 10, offset = 0 } = options;
      
      const query = `
        SELECT a.*, 
               d.first_name as doctor_first_name, d.last_name as doctor_last_name
        FROM appointments a
        LEFT JOIN doctors d ON a.doctor_id = d.id
        WHERE a.patient_id = $1
        ORDER BY a.appointment_datetime DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await this.query(query, [patientId, limit, offset]);
      return result.rows;
    } catch (error) {
      api.error('Error getting patient appointments:', error);
      throw error;
    }
  }

  /**
   * Get appointment statistics
   * @param {Object} filters - Optional filters
   * @returns {Object} Statistics
   */
  async getAppointmentStats(filters = {}) {
    try {
      const whereConditions = {};
      if (filters.doctor_id) whereConditions.doctor_id = filters.doctor_id;
      if (filters.start_date) whereConditions.appointment_date = { $gte: filters.start_date };
      if (filters.end_date) whereConditions.appointment_date = { $lte: filters.end_date };

      const whereClause = this.buildWhereClause(whereConditions);
      
      const query = `
        SELECT 
          COUNT(*) as total_appointments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
          COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
          COUNT(CASE WHEN status = 'no-show' THEN 1 END) as no_show
        FROM appointments
        ${whereClause.clause}
      `;

      const result = await this.query(query, whereClause.params);
      return result.rows[0];
    } catch (error) {
      api.error('Error getting appointment stats:', error);
      throw error;
    }
  }
}

module.exports = AppointmentRepository; 