const BaseRepository = require('./base.repository');

/**
 * Doctor Repository Class
 * Handles database operations for doctors table
 */
class DoctorRepository extends BaseRepository {
  constructor() {
    super('doctors');
  }

  /**
   * Create doctor profile
   * @param {Object} doctorData - Doctor data
   * @returns {Object} Created doctor record
   */
  async createDoctor(doctorData) {
    const data = {
      ...doctorData,
      status: doctorData.status || 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    return await this.create(data);
  }

  /**
   * Find doctor by user ID
   * @param {number} userId - User ID
   * @returns {Object|null} Doctor record or null
   */
  async findByUserId(userId) {
    return await this.findOne({ user_id: userId, status: 'active' });
  }

  /**
   * Find doctor by ID with user info
   * @param {number} doctorId - Doctor ID
   * @returns {Object|null} Doctor record with user info
   */
  async findDoctorWithUser(doctorId) {
    const query = `
      SELECT 
        d.*,
        u.email,
        u.phone_number,
        u.role
      FROM ${this.tableName} d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = $1
    `;

    const result = await this.query(query, [doctorId]);
    return result.rows[0] || null;
  }

  /**
   * Get active doctors
   * @param {Object} options - Query options
   * @returns {Array} Active doctors
   */
  async getActiveDoctors(options = {}) {
    const query = `
      SELECT 
        id, user_id, first_name, last_name,
        specialization, phone_number, email, office_address, 
        is_available, status, created_at, updated_at
      FROM ${this.tableName}
      WHERE status = 'active'
      ORDER BY first_name ASC, last_name ASC
      ${options.limit ? `LIMIT ${options.limit}` : ''}
      ${options.offset ? `OFFSET ${options.offset}` : ''}
    `;

    const result = await this.query(query);
    return result.rows;
  }

  /**
   * Get doctors by specialization
   * @param {string} specialization - Specialization to filter by
   * @param {Object} options - Query options
   * @returns {Array} Matching doctors
   */
  async getDoctorsBySpecialization(specialization, options = {}) {
    const query = `
      SELECT 
        id, user_id, first_name, last_name,
        specialization, phone_number, email, office_address, 
        is_available, status, created_at, updated_at
      FROM ${this.tableName}
      WHERE status = 'active'
      AND specialization ILIKE $1
      ORDER BY first_name ASC, last_name ASC
      ${options.limit ? `LIMIT ${options.limit}` : ''}
      ${options.offset ? `OFFSET ${options.offset}` : ''}
    `;

    const result = await this.query(query, [`%${specialization}%`]);
    return result.rows;
  }

  /**
   * Get doctors with appointment counts
   * @param {Object} options - Query options
   * @returns {Array} Doctors with appointment statistics
   */
  async getDoctorsWithAppointmentCounts(options = {}) {
    const query = `
      SELECT 
        d.id, d.user_id, d.first_name, d.last_name, d.specialization,
        d.status, d.created_at,
        u.email, u.phone_number,
        COUNT(a.id) as total_appointments,
        COUNT(CASE WHEN a.status = 'scheduled' THEN 1 END) as scheduled_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
        COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_appointments
      FROM ${this.tableName} d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN appointments a ON d.id = a.doctor_id
      WHERE d.status = 'active'
      GROUP BY d.id, u.id
      ORDER BY total_appointments DESC, d.first_name ASC, d.last_name ASC
      ${options.limit ? `LIMIT ${options.limit}` : ''}
      ${options.offset ? `OFFSET ${options.offset}` : ''}
    `;

    const result = await this.query(query);
    return result.rows;
  }

  /**
   * Get doctor's next available appointment slot
   * @param {number} doctorId - Doctor ID
   * @param {Date} fromDate - Start date to search from
   * @returns {Object|null} Next available slot info
   */
  async getNextAvailableSlot(doctorId, fromDate = new Date()) {
    const query = `
      SELECT 
        DATE_TRUNC('hour', $2) + INTERVAL '1 hour' * generate_series(0, 168) as slot_time
      FROM generate_series(0, 168) 
      WHERE NOT EXISTS (
        SELECT 1 FROM appointments 
        WHERE doctor_id = $1 
        AND appointment_date = DATE_TRUNC('hour', $2) + INTERVAL '1 hour' * generate_series(0, 168)
        AND status IN ('scheduled', 'confirmed')
      )
      AND EXTRACT(hour FROM DATE_TRUNC('hour', $2) + INTERVAL '1 hour' * generate_series(0, 168)) BETWEEN 9 AND 17
      AND EXTRACT(dow FROM DATE_TRUNC('hour', $2) + INTERVAL '1 hour' * generate_series(0, 168)) BETWEEN 1 AND 5
      ORDER BY slot_time ASC
      LIMIT 1
    `;

    const result = await this.query(query, [doctorId, fromDate]);
    return result.rows[0] || null;
  }

  /**
   * Get doctor's schedule for a specific day
   * @param {number} doctorId - Doctor ID
   * @param {number} dayOfWeek - Day of week (1-7)
   * @returns {Object|null} Schedule for the day
   */
  async getDoctorSchedule(doctorId, dayOfWeek) {
    const query = `
      SELECT 
        ds.*,
        d.first_name,
        d.last_name,
        d.specialization
      FROM doctor_schedules ds
      JOIN doctors d ON d.id = ds.doctor_id
      WHERE ds.doctor_id = $1 AND ds.day_of_week = $2
    `;

    const result = await this.query(query, [doctorId, dayOfWeek]);
    return result.rows[0] || null;
  }

  /**
   * Get doctor's full weekly schedule
   * @param {number} doctorId - Doctor ID
   * @returns {Array} Weekly schedule
   */
  async getDoctorWeeklySchedule(doctorId) {
    const query = `
      SELECT 
        ds.*,
        d.first_name,
        d.last_name,
        d.specialization
      FROM doctor_schedules ds
      JOIN doctors d ON d.id = ds.doctor_id
      WHERE ds.doctor_id = $1
      ORDER BY ds.day_of_week
    `;

    const result = await this.query(query, [doctorId]);
    return result.rows;
  }

  /**
   * Create default schedules for a doctor if they don't exist
   * @param {number} doctorId - Doctor ID
   * @returns {Array} Created schedules
   */
  async createDefaultSchedules(doctorId) {
    // Check if schedules already exist
    const existingSchedules = await this.getDoctorWeeklySchedule(doctorId);
    if (existingSchedules.length > 0) {
      return existingSchedules;
    }

    // Create default schedules
    const schedules = [
      // Tuesday, Thursday, Saturday - appointments only
      { day_of_week: 2, start_time: '09:00', end_time: '17:00', is_available: true, accepts_walkin: false },
      { day_of_week: 4, start_time: '09:00', end_time: '17:00', is_available: true, accepts_walkin: false },
      { day_of_week: 6, start_time: '09:00', end_time: '17:00', is_available: true, accepts_walkin: false },
      // Monday, Wednesday - with walk-ins
      { day_of_week: 1, start_time: '09:00', end_time: '20:00', is_available: true, accepts_walkin: true },
      { day_of_week: 3, start_time: '09:00', end_time: '20:00', is_available: true, accepts_walkin: true },
      // Friday - with walk-ins
      { day_of_week: 5, start_time: '09:00', end_time: '17:00', is_available: true, accepts_walkin: true }
    ];

    const createdSchedules = [];
    for (const schedule of schedules) {
      const query = `
        INSERT INTO doctor_schedules (doctor_id, day_of_week, start_time, end_time, is_available, accepts_walkin)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        doctorId,
        schedule.day_of_week,
        schedule.start_time,
        schedule.end_time,
        schedule.is_available,
        schedule.accepts_walkin
      ];

      const result = await this.query(query, values);
      createdSchedules.push(result.rows[0]);
    }

    return createdSchedules;
  }

  /**
   * Update doctor's schedule for a specific day
   * @param {number} doctorId - Doctor ID
   * @param {number} dayOfWeek - Day of week (1-7)
   * @param {Object} scheduleData - Schedule data
   * @returns {Object} Updated schedule
   */
  async updateDoctorSchedule(doctorId, dayOfWeek, scheduleData) {
    const query = `
      UPDATE doctor_schedules
      SET 
        start_time = $1,
        end_time = $2,
        is_available = $3,
        accepts_walkin = $4,
        updated_at = NOW()
      WHERE doctor_id = $5 AND day_of_week = $6
      RETURNING *
    `;

    const values = [
      scheduleData.start_time,
      scheduleData.end_time,
      scheduleData.is_available,
      scheduleData.accepts_walkin,
      doctorId,
      dayOfWeek
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get doctor by ID
   * @param {number} doctorId - Doctor ID
   * @returns {Object|null} Doctor record
   */
  async getDoctorById(doctorId) {
    return await this.findById(doctorId);
  }

  /**
   * Get doctor's assigned patients
   * @param {number} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Object} Patients with pagination info
   */
  async getDoctorPatients(doctorId, options = {}) {
    const { page = 1, limit = 20, search = '', status = null } = options;
    const offset = (page - 1) * limit;

    // Build search conditions
    let searchConditions = '';
    let searchParams = [doctorId];
    let paramIndex = 2;

    if (search) {
      searchConditions += ` AND (u.first_name ILIKE $${paramIndex} OR u.last_name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      searchParams.push(`%${search}%`);
      paramIndex++;
    }

    if (status) {
      searchConditions += ` AND u.status = $${paramIndex}`;
      searchParams.push(status);
      paramIndex++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      WHERE u.role = 'patient'
        AND EXISTS (
          SELECT 1 FROM appointments a 
          WHERE a.patient_id = u.id AND a.doctor_id = $1
          UNION
          SELECT 1 FROM incidents i 
          WHERE i.user_id = u.id AND i.doctor_id = $1
        )
        ${searchConditions}
    `;

    const countResult = await this.query(countQuery, searchParams);
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Get patients with their recent incidents
    const query = `
      SELECT 
        u.id as patient_id,
        u.first_name,
        u.last_name,
        u.email,
        u.status,
        u.created_at,
        
        -- Incident statistics
        COUNT(DISTINCT i.id) as total_incidents,
        COUNT(DISTINCT CASE WHEN i.status IN ('active', 'pending') THEN i.id END) as active_incidents,
        MAX(i.created_at) as last_incident_date,
        
        -- Appointment statistics  
        COUNT(DISTINCT a.id) as total_appointments,
        COUNT(DISTINCT CASE WHEN a.status = 'scheduled' THEN a.id END) as scheduled_appointments,
        
        -- Recent incidents (last 5)
        JSON_AGG(
          DISTINCT jsonb_build_object(
            'id', i.id,
            'incident_type', i.incident_type,
            'title', i.title,
            'status', i.status,
            'created_at', i.created_at,
            'incident_date', i.incident_date
          ) 
          ORDER BY i.created_at DESC
        ) FILTER (WHERE i.id IS NOT NULL) as recent_incidents
        
      FROM users u
      LEFT JOIN incidents i ON i.user_id = u.id AND i.doctor_id = $1
      LEFT JOIN appointments a ON a.patient_id = u.id AND a.doctor_id = $1
      WHERE u.role = 'patient'
        AND EXISTS (
          SELECT 1 FROM appointments a2 
          WHERE a2.patient_id = u.id AND a2.doctor_id = $1
          UNION
          SELECT 1 FROM incidents i2 
          WHERE i2.user_id = u.id AND i2.doctor_id = $1
        )
        ${searchConditions}
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.status, u.created_at
      ORDER BY last_incident_date DESC NULLS LAST, u.first_name ASC, u.last_name ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    searchParams.push(limit, offset);
    const result = await this.query(query, searchParams);

    // Process recent_incidents to limit to 5 most recent
    const patients = result.rows.map(patient => ({
      ...patient,
      recent_incidents: (patient.recent_incidents || [])
        .filter(incident => incident.id !== null)
        .slice(0, 5)
    }));

    return {
      data: patients,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  /**
   * Verify if doctor has access to a specific patient
   * @param {number} doctorId - Doctor ID
   * @param {number} patientId - Patient ID
   * @returns {boolean} True if doctor has access
   */
  async verifyDoctorPatientAccess(doctorId, patientId) {
    const query = `
      SELECT EXISTS (
        SELECT 1 FROM appointments 
        WHERE doctor_id = $1 AND patient_id = $2
        UNION
        SELECT 1 FROM incidents 
        WHERE doctor_id = $1 AND user_id = $2
      ) as has_access
    `;

    const result = await this.query(query, [doctorId, patientId]);
    return result.rows[0]?.has_access || false;
  }

  /**
   * Get detailed patient information for doctor
   * @param {number} doctorId - Doctor ID
   * @param {number} patientId - Patient ID
   * @returns {Object|null} Detailed patient information
   */
  async getPatientDetailsForDoctor(doctorId, patientId) {
    const query = `
      SELECT 
        u.id as patient_id,
        u.first_name,
        u.last_name,
        u.email,
        u.phone_number,
        u.status,
        u.created_at,
        
        -- All incidents for this patient-doctor relationship
        JSON_AGG(
          DISTINCT jsonb_build_object(
            'id', i.id,
            'incident_type', i.incident_type,
            'title', i.title,
            'description', i.description,
            'status', i.status,
            'created_at', i.created_at,
            'incident_date', i.incident_date,
            'incident_time', i.incident_time,
            'incident_location', i.incident_location,
            'total_reports', i.completed_forms
          )
          ORDER BY i.created_at DESC
        ) FILTER (WHERE i.id IS NOT NULL) as incidents,
        
        -- All appointments for this patient-doctor relationship
        JSON_AGG(
          DISTINCT jsonb_build_object(
            'id', a.id,
            'appointment_date', a.appointment_date,
            'start_time', a.start_time,
            'end_time', a.end_time,
            'status', a.status,
            'appointment_type', a.appointment_type,
            'notes', a.notes,
            'created_at', a.created_at
          )
          ORDER BY a.appointment_date DESC
        ) FILTER (WHERE a.id IS NOT NULL) as appointments
        
      FROM users u
      LEFT JOIN incidents i ON i.user_id = u.id AND i.doctor_id = $1
      LEFT JOIN appointments a ON a.patient_id = u.id AND a.doctor_id = $1
      WHERE u.id = $2 AND u.role = 'patient'
      GROUP BY u.id, u.first_name, u.last_name, u.email, u.phone_number, u.status, u.created_at
    `;

    const result = await this.query(query, [doctorId, patientId]);
    return result.rows[0] || null;
  }

  /**
   * Get doctor's dashboard statistics
   * @param {number} doctorId - Doctor ID
   * @returns {Object} Dashboard statistics
   */
  async getDoctorStats(doctorId) {
    const query = `
      SELECT 
        -- Patient counts
        COUNT(DISTINCT CASE WHEN u.role = 'patient' THEN u.id END) as total_patients,
        COUNT(DISTINCT CASE WHEN u.role = 'patient' AND u.status = 'active' THEN u.id END) as active_patients,
        
        -- Incident counts
        COUNT(DISTINCT i.id) as total_incidents,
        COUNT(DISTINCT CASE WHEN i.status = 'active' THEN i.id END) as active_incidents,
        COUNT(DISTINCT CASE WHEN i.status = 'completed' THEN i.id END) as completed_incidents,
        
        -- Appointment counts
        COUNT(DISTINCT a.id) as total_appointments,
        COUNT(DISTINCT CASE WHEN a.status = 'scheduled' THEN a.id END) as scheduled_appointments,
        COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments,
        COUNT(DISTINCT CASE WHEN a.appointment_date >= CURRENT_DATE THEN a.id END) as upcoming_appointments,
        
        -- Recent activity
        COUNT(DISTINCT CASE WHEN i.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN i.id END) as incidents_this_week,
        COUNT(DISTINCT CASE WHEN a.created_at >= CURRENT_DATE - INTERVAL '7 days' THEN a.id END) as appointments_this_week
        
      FROM doctors d
      LEFT JOIN incidents i ON i.doctor_id = d.id
      LEFT JOIN appointments a ON a.doctor_id = d.id
      LEFT JOIN users u ON (i.user_id = u.id OR a.patient_id = u.id)
      WHERE d.id = $1
      GROUP BY d.id
    `;

    const result = await this.query(query, [doctorId]);
    return result.rows[0] || {
      total_patients: 0,
      active_patients: 0,
      total_incidents: 0,
      active_incidents: 0,
      completed_incidents: 0,
      total_appointments: 0,
      scheduled_appointments: 0,
      completed_appointments: 0,
      upcoming_appointments: 0,
      incidents_this_week: 0,
      appointments_this_week: 0
    };
  }
}

module.exports = DoctorRepository; 