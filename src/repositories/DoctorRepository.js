const BaseRepository = require('./BaseRepository');

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
        d.id, d.user_id, d.first_name, d.last_name,
        d.specialization, d.status, d.created_at,
        u.email, u.phone_number
      FROM ${this.tableName} d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'active'
      ORDER BY d.first_name ASC, d.last_name ASC
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
        d.id, d.user_id, d.first_name, d.last_name,
        d.specialization, d.status, d.created_at,
        u.email, u.phone_number
      FROM ${this.tableName} d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'active'
      AND d.specialization ILIKE $1
      ORDER BY d.first_name ASC, d.last_name ASC
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
}

module.exports = DoctorRepository; 