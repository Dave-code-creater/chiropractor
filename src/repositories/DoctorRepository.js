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
   * Find doctor by user ID
   * @param {number} userId - User ID
   * @returns {Object|null} Doctor record or null
   */
  async findByUserId(userId) {
    return await this.findOne({ user_id: userId, status: 'active' });
  }

  /**
   * Find doctor by license number
   * @param {string} licenseNumber - License number
   * @returns {Object|null} Doctor record or null
   */
  async findByLicenseNumber(licenseNumber) {
    return await this.findOne({ license_number: licenseNumber, status: 'active' });
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
   * Get doctor with user information
   * @param {number} doctorId - Doctor ID
   * @returns {Object|null} Doctor with user data
   */
  async getDoctorWithUser(doctorId) {
    const query = `
      SELECT 
        d.*, 
        u.email, u.username, u.role, u.phone_number as user_phone, 
        u.is_verified, u.phone_verified, u.status as user_status,
        u.last_login_at, u.created_at as user_created_at
      FROM ${this.tableName} d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = $1
    `;
    
    const result = await this.query(query, [doctorId]);
    return result.rows[0] || null;
  }

  /**
   * Get doctor by user ID with user information
   * @param {number} userId - User ID
   * @returns {Object|null} Doctor with user data
   */
  async getDoctorByUserIdWithUser(userId) {
    const query = `
      SELECT 
        d.*, 
        u.email, u.username, u.role, u.phone_number as user_phone, 
        u.is_verified, u.phone_verified, u.status as user_status,
        u.last_login_at, u.created_at as user_created_at
      FROM ${this.tableName} d
      JOIN users u ON d.user_id = u.id
      WHERE d.user_id = $1 AND d.status = 'active'
    `;
    
    const result = await this.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Search doctors by name, specialization, or license number
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Array} Matching doctors
   */
  async searchDoctors(searchTerm, options = {}) {
    const query = `
      SELECT 
        d.id, d.user_id, d.first_name, d.last_name, d.specialization, 
        d.license_number, d.status, d.created_at,
        u.email, u.username, u.phone_number, u.last_login_at
      FROM ${this.tableName} d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'active' AND (
        d.first_name ILIKE $1 OR 
        d.last_name ILIKE $1 OR
        d.specialization ILIKE $1 OR
        d.license_number ILIKE $1 OR
        CONCAT(d.first_name, ' ', d.last_name) ILIKE $1 OR
        u.email ILIKE $1 OR
        u.username ILIKE $1
      )
      ORDER BY d.created_at DESC
      ${options.limit ? `LIMIT ${options.limit}` : ''}
      ${options.offset ? `OFFSET ${options.offset}` : ''}
    `;
    
    const result = await this.query(query, [`%${searchTerm}%`]);
    return result.rows;
  }

  /**
   * Get doctors by specialization
   * @param {string} specialization - Specialization
   * @param {Object} options - Query options
   * @returns {Array} Doctors by specialization
   */
  async getDoctorsBySpecialization(specialization, options = {}) {
    return await this.findBy({ specialization, status: 'active' }, '*', options);
  }

  /**
   * Get all active doctors with basic info
   * @param {Object} options - Query options
   * @returns {Array} Active doctors
   */
  async getActiveDoctors(options = {}) {
    const query = `
      SELECT 
        d.id, d.user_id, d.first_name, d.last_name, d.specialization, 
        d.license_number, d.status, d.created_at,
        u.email, u.username, u.phone_number
      FROM ${this.tableName} d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'active' AND u.status = 'active'
      ORDER BY d.first_name ASC, d.last_name ASC
      ${options.limit ? `LIMIT ${options.limit}` : ''}
      ${options.offset ? `OFFSET ${options.offset}` : ''}
    `;
    
    const result = await this.query(query);
    return result.rows;
  }

  /**
   * Get doctor statistics
   * @returns {Object} Doctor statistics
   */
  async getDoctorStats() {
    const query = `
      SELECT 
        COUNT(*) as total_doctors,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_doctors,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_doctors,
        COUNT(DISTINCT specialization) as unique_specializations,
        COUNT(CASE WHEN license_number IS NOT NULL THEN 1 END) as doctors_with_license
      FROM ${this.tableName}
    `;
    
    const result = await this.query(query);
    return result.rows[0];
  }

  /**
   * Get specialization statistics
   * @returns {Array} Specialization counts
   */
  async getSpecializationStats() {
    const query = `
      SELECT 
        specialization,
        COUNT(*) as doctor_count
      FROM ${this.tableName}
      WHERE status = 'active' AND specialization IS NOT NULL
      GROUP BY specialization
      ORDER BY doctor_count DESC, specialization ASC
    `;
    
    const result = await this.query(query);
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
        d.license_number, d.status, d.created_at,
        u.email, u.username, u.phone_number,
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
   * Check if license number exists
   * @param {string} licenseNumber - License number to check
   * @param {number} excludeDoctorId - Doctor ID to exclude from check
   * @returns {boolean} True if license number exists
   */
  async licenseNumberExists(licenseNumber, excludeDoctorId = null) {
    if (!licenseNumber) return false;
    
    const conditions = { license_number: licenseNumber };
    if (excludeDoctorId) {
      const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE license_number = $1 AND id != $2`;
      const result = await this.query(query, [licenseNumber, excludeDoctorId]);
      return parseInt(result.rows[0].count) > 0;
    }
    return await this.exists(conditions);
  }

  /**
   * Get recent doctors
   * @param {number} limit - Number of recent doctors to get
   * @returns {Array} Recent doctors
   */
  async getRecentDoctors(limit = 10) {
    const query = `
      SELECT 
        d.id, d.first_name, d.last_name, d.specialization, d.license_number,
        d.created_at, u.email, u.username, u.last_login_at
      FROM ${this.tableName} d
      JOIN users u ON d.user_id = u.id
      WHERE d.status = 'active'
      ORDER BY d.created_at DESC
      LIMIT $1
    `;
    
    const result = await this.query(query, [limit]);
    return result.rows;
  }

  /**
   * Update doctor specialization
   * @param {number} doctorId - Doctor ID
   * @param {string} specialization - New specialization
   * @returns {Object|null} Updated doctor record
   */
  async updateSpecialization(doctorId, specialization) {
    return await this.updateById(doctorId, { specialization });
  }

  /**
   * Update doctor license number
   * @param {number} doctorId - Doctor ID
   * @param {string} licenseNumber - New license number
   * @returns {Object|null} Updated doctor record
   */
  async updateLicenseNumber(doctorId, licenseNumber) {
    return await this.updateById(doctorId, { license_number: licenseNumber });
  }

  /**
   * Deactivate doctor
   * @param {number} doctorId - Doctor ID
   * @returns {Object|null} Updated doctor record
   */
  async deactivateDoctor(doctorId) {
    return await this.updateById(doctorId, { status: 'inactive' });
  }

  /**
   * Reactivate doctor
   * @param {number} doctorId - Doctor ID
   * @returns {Object|null} Updated doctor record
   */
  async reactivateDoctor(doctorId) {
    return await this.updateById(doctorId, { status: 'active' });
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
}

module.exports = DoctorRepository; 