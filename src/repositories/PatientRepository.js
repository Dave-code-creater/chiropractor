const BaseRepository = require('./BaseRepository');

/**
 * Patient Repository Class
 * Handles database operations for patients table
 */
class PatientRepository extends BaseRepository {
  constructor() {
    super('patients');
  }

  /**
   * Find patient by user ID
   * @param {number} userId - User ID
   * @returns {Object|null} Patient record or null
   */
  async findByUserId(userId) {
    return await this.findOne({ user_id: userId, status: 'active' });
  }

  /**
   * Find patient by patient ID
   * @param {number} patientId - Patient ID
   * @returns {Object|null} Patient record or null
   */
  async findPatientById(patientId) {
    return await this.findById(patientId);
  }

  /**
   * Create patient profile
   * @param {Object} patientData - Patient data
   * @returns {Object} Created patient record
   */
  async createPatient(patientData) {
    const data = {
      ...patientData,
      status: patientData.status || 'active',
      created_at: new Date(),
      updated_at: new Date()
    };

    return await this.create(data);
  }

  /**
   * Update patient profile
   * @param {number} patientId - Patient ID
   * @param {Object} updateData - Update data
   * @returns {Object|null} Updated patient record
   */
  async updatePatient(patientId, updateData) {
    const data = {
      ...updateData,
      updated_at: new Date()
    };

    return await this.updateById(patientId, data);
  }

  /**
   * Find all patients with pagination and search
   * @param {Object} options - Query options
   * @returns {Object} Patients and total count
   */
  async findAllPatients(options = {}) {
    const {
      search,
      status = 'active',
      sort_by = 'created_at',
      sort_order = 'desc',
      limit = 10,
      offset = 0
    } = options;

    let whereConditions = [`p.status = $1`];
    let queryParams = [status];
    let paramIndex = 2;

    if (search) {
      whereConditions.push(`(
        p.first_name ILIKE $${paramIndex} OR 
        p.last_name ILIKE $${paramIndex} OR
        p.email ILIKE $${paramIndex} OR
        p.phone ILIKE $${paramIndex} OR
        CONCAT(p.first_name, ' ', p.last_name) ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${this.tableName} p
      ${whereClause}
    `;
    
    const countResult = await this.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Main query with appointment data
    const query = `
      SELECT 
        p.*,
        u.email as user_email, u.username, u.role, u.last_login_at,
        MAX(a.appointment_date) as last_appointment_date
      FROM ${this.tableName} p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN appointments a ON p.id = a.patient_id
      ${whereClause}
      GROUP BY p.id, u.email, u.username, u.role, u.last_login_at
      ORDER BY p.${sort_by} ${sort_order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await this.query(query, queryParams);

    return {
      patients: result.rows,
      total
    };
  }

  /**
   * Find patient vitals
   * @param {number} patientId - Patient ID
   * @returns {Array} Patient vitals records
   */
  async findPatientVitals(patientId) {
    const query = `
      SELECT 
        v.*,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM vitals v
      LEFT JOIN doctors d ON v.recorded_by = d.id
      WHERE v.patient_id = $1
      ORDER BY v.recorded_at DESC
    `;
    
    const result = await this.query(query, [patientId]);
    return result.rows;
  }

  /**
   * Get patient with user information
   * @param {number} patientId - Patient ID
   * @returns {Object|null} Patient with user data
   */
  async getPatientWithUser(patientId) {
    const query = `
      SELECT 
        p.*, 
        u.email, u.username, u.role, u.phone_number as user_phone, 
        u.is_verified, u.phone_verified, u.status as user_status,
        u.last_login_at, u.created_at as user_created_at
      FROM ${this.tableName} p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = $1
    `;
    
    const result = await this.query(query, [patientId]);
    return result.rows[0] || null;
  }

  /**
   * Get patient by user ID with user information
   * @param {number} userId - User ID
   * @returns {Object|null} Patient with user data
   */
  async getPatientByUserIdWithUser(userId) {
    const query = `
      SELECT 
        p.*, 
        u.email, u.username, u.role, u.phone_number as user_phone, 
        u.is_verified, u.phone_verified, u.status as user_status,
        u.last_login_at, u.created_at as user_created_at
      FROM ${this.tableName} p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = $1 AND p.status = 'active'
    `;
    
    const result = await this.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Search patients by name, email, or phone
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Array} Matching patients
   */
  async searchPatients(searchTerm, options = {}) {
    const query = `
      SELECT 
        p.id, p.user_id, p.first_name, p.last_name, p.email, p.phone,
        p.date_of_birth, p.gender, p.status, p.created_at,
        u.username, u.role, u.last_login_at
      FROM ${this.tableName} p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'active' AND (
        p.first_name ILIKE $1 OR 
        p.last_name ILIKE $1 OR
        p.email ILIKE $1 OR
        p.phone ILIKE $1 OR
        CONCAT(p.first_name, ' ', p.last_name) ILIKE $1 OR
        u.username ILIKE $1
      )
      ORDER BY p.created_at DESC
      ${options.limit ? `LIMIT ${options.limit}` : ''}
      ${options.offset ? `OFFSET ${options.offset}` : ''}
    `;
    
    const result = await this.query(query, [`%${searchTerm}%`]);
    return result.rows;
  }

  /**
   * Get patients by age range
   * @param {number} minAge - Minimum age
   * @param {number} maxAge - Maximum age
   * @param {Object} options - Query options
   * @returns {Array} Patients in age range
   */
  async getPatientsByAgeRange(minAge, maxAge, options = {}) {
    const query = `
      SELECT p.*, u.email, u.username
      FROM ${this.tableName} p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'active' 
        AND p.age >= $1 
        AND p.age <= $2
      ORDER BY p.age ASC
      ${options.limit ? `LIMIT ${options.limit}` : ''}
      ${options.offset ? `OFFSET ${options.offset}` : ''}
    `;
    
    const result = await this.query(query, [minAge, maxAge]);
    return result.rows;
  }

  /**
   * Get patients by gender
   * @param {string} gender - Gender
   * @param {Object} options - Query options
   * @returns {Array} Patients by gender
   */
  async getPatientsByGender(gender, options = {}) {
    return await this.findBy({ gender, status: 'active' }, '*', options);
  }

  /**
   * Get patients with upcoming birthdays
   * @param {number} days - Number of days ahead to check
   * @returns {Array} Patients with upcoming birthdays
   */
  async getPatientsWithUpcomingBirthdays(days = 30) {
    const query = `
      SELECT p.*, u.email, u.username
      FROM ${this.tableName} p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'active' 
        AND p.date_of_birth IS NOT NULL
        AND EXTRACT(DOY FROM p.date_of_birth) BETWEEN 
            EXTRACT(DOY FROM CURRENT_DATE) 
            AND EXTRACT(DOY FROM CURRENT_DATE + INTERVAL '${days} days')
      ORDER BY EXTRACT(DOY FROM p.date_of_birth) ASC
    `;
    
    const result = await this.query(query);
    return result.rows;
  }

  /**
   * Update patient medical history
   * @param {number} patientId - Patient ID
   * @param {Object} medicalHistory - Medical history data
   * @returns {Object|null} Updated patient record
   */
  async updateMedicalHistory(patientId, medicalHistory) {
    return await this.updateById(patientId, { 
      medical_history: JSON.stringify(medicalHistory) 
    });
  }

  /**
   * Update patient insurance information
   * @param {number} patientId - Patient ID
   * @param {Object} insuranceInfo - Insurance information
   * @returns {Object|null} Updated patient record
   */
  async updateInsuranceInfo(patientId, insuranceInfo) {
    return await this.updateById(patientId, { 
      insurance_info: JSON.stringify(insuranceInfo) 
    });
  }

  /**
   * Get patient statistics
   * @returns {Object} Patient statistics
   */
  async getPatientStats() {
    const query = `
      SELECT 
        COUNT(*) as total_patients,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_patients,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_patients,
        COUNT(CASE WHEN gender = 'male' THEN 1 END) as male_patients,
        COUNT(CASE WHEN gender = 'female' THEN 1 END) as female_patients,
        COUNT(CASE WHEN gender = 'other' THEN 1 END) as other_gender_patients,
        ROUND(AVG(age), 2) as average_age,
        MIN(age) as youngest_age,
        MAX(age) as oldest_age,
        COUNT(CASE WHEN insurance_info IS NOT NULL THEN 1 END) as patients_with_insurance,
        COUNT(CASE WHEN medical_history IS NOT NULL THEN 1 END) as patients_with_medical_history
      FROM ${this.tableName}
      WHERE status = 'active'
    `;
    
    const result = await this.query(query);
    return result.rows[0];
  }

  /**
   * Get patients by insurance type
   * @param {string} insuranceType - Insurance type
   * @param {Object} options - Query options
   * @returns {Array} Patients with specific insurance type
   */
  async getPatientsByInsuranceType(insuranceType, options = {}) {
    const query = `
      SELECT p.*, u.email, u.username
      FROM ${this.tableName} p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'active' 
        AND p.insurance_info->>'type' = $1
      ORDER BY p.created_at DESC
      ${options.limit ? `LIMIT ${options.limit}` : ''}
      ${options.offset ? `OFFSET ${options.offset}` : ''}
    `;
    
    const result = await this.query(query, [insuranceType]);
    return result.rows;
  }

  /**
   * Get recent patients
   * @param {number} limit - Number of recent patients to get
   * @returns {Array} Recent patients
   */
  async getRecentPatients(limit = 10) {
    const query = `
      SELECT 
        p.id, p.first_name, p.last_name, p.email, p.phone,
        p.created_at, u.username, u.last_login_at
      FROM ${this.tableName} p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'active'
      ORDER BY p.created_at DESC
      LIMIT $1
    `;
    
    const result = await this.query(query, [limit]);
    return result.rows;
  }

  /**
   * Deactivate patient
   * @param {number} patientId - Patient ID
   * @returns {Object|null} Updated patient record
   */
  async deactivatePatient(patientId) {
    return await this.updateById(patientId, { status: 'inactive' });
  }

  /**
   * Reactivate patient
   * @param {number} patientId - Patient ID
   * @returns {Object|null} Updated patient record
   */
  async reactivatePatient(patientId) {
    return await this.updateById(patientId, { status: 'active' });
  }
}

module.exports = PatientRepository; 