const BaseRepository = require('./BaseRepository');
const bcrypt = require('bcryptjs');
const { database, error: logError, info } = require('../utils/logger');

/**
 * User Repository Class
 * Handles database operations for users table
 */
class UserRepository extends BaseRepository {
  constructor() {
    super('users');
  }

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Object|null} User record or null
   */
  async findByEmail(email) {
    return await this.findOne({ email, status: 'active' });
  }

  /**
   * Find user by username
   * @param {string} username - Username
   * @returns {Object|null} User record or null
   */
  async findByUsername(username) {
    return await this.findOne({ username, status: 'active' });
  }

  /**
   * Find user by email or username
   * @param {string} identifier - Email or username
   * @returns {Object|null} User record or null
   */
  async findByEmailOrUsername(identifier) {
    const query = `
      SELECT * FROM ${this.tableName} 
      WHERE (email = $1 OR username = $1) AND status = 'active'
    `;
    const result = await this.query(query, [identifier]);
    return result.rows[0] || null;
  }

  /**
   * Create a new user with hashed password
   * @param {Object} userData - User data
   * @returns {Object} Created user record
   */
  async createUser(userData) {
    const {
      email,
      username,
      password,
      role = 'patient',
      phone_number,
      is_verified = false,
      phone_verified = false,
      status = 'active'
    } = userData;

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Generate username if not provided
    const finalUsername = username || email.split('@')[0];

    const data = {
      email,
      username: finalUsername,
      password_hash,
      role,
      phone_number,
      is_verified,
      phone_verified,
      status,
      created_at: new Date(),
      updated_at: new Date()
    };

    return await this.create(data);
  }

  /**
   * Update user's last login timestamp
   * @param {number} userId - User ID
   * @returns {Object|null} Updated user record
   */
  async updateLastLogin(userId) {
    return await this.updateById(userId, { 
      last_login_at: new Date() 
    });
  }

  /**
   * Verify user password
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Hashed password from database
   * @returns {boolean} True if password matches
   */
  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  /**
   * Update user password
   * @param {number} userId - User ID
   * @param {string} newPassword - New plain text password
   * @returns {Object|null} Updated user record
   */
  async updatePassword(userId, newPassword) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);
    
    return await this.updateById(userId, { password_hash });
  }

  /**
   * Find users by role
   * @param {string} role - User role
   * @param {Object} options - Query options
   * @returns {Array} User records
   */
  async findByRole(role, options = {}) {
    return await this.findBy({ role, status: 'active' }, '*', options);
  }

  /**
   * Activate user account
   * @param {number} userId - User ID
   * @returns {Object|null} Updated user record
   */
  async activateUser(userId) {
    return await this.updateById(userId, { 
      status: 'active',
      is_verified: true 
    });
  }

  /**
   * Deactivate user account
   * @param {number} userId - User ID
   * @returns {Object|null} Updated user record
   */
  async deactivateUser(userId) {
    return await this.updateById(userId, { status: 'inactive' });
  }

  /**
   * Check if email exists
   * @param {string} email - Email to check
   * @param {number} excludeUserId - User ID to exclude from check
   * @returns {boolean} True if email exists
   */
  async emailExists(email, excludeUserId = null) {
    const conditions = { email };
    if (excludeUserId) {
      // We need to use raw query for NOT condition
      const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE email = $1 AND id != $2`;
      const result = await this.query(query, [email, excludeUserId]);
      return parseInt(result.rows[0].count) > 0;
    }
    return await this.exists(conditions);
  }

  /**
   * Check if username exists
   * @param {string} username - Username to check
   * @param {number} excludeUserId - User ID to exclude from check
   * @returns {boolean} True if username exists
   */
  async usernameExists(username, excludeUserId = null) {
    const conditions = { username };
    if (excludeUserId) {
      const query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE username = $1 AND id != $2`;
      const result = await this.query(query, [username, excludeUserId]);
      return parseInt(result.rows[0].count) > 0;
    }
    return await this.exists(conditions);
  }

  /**
   * Get user with profile data (joins with patients/doctors tables)
   * @param {number} userId - User ID
   * @returns {Object|null} User with profile data
   */
  async getUserWithProfile(userId) {
    const query = `
      SELECT 
        u.id, u.email, u.username, u.role, u.phone_number, u.status, 
        u.is_verified, u.phone_verified, u.last_login_at, u.created_at, u.updated_at,
        p.id as patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name,
        p.date_of_birth, p.gender, p.marriage_status, p.race,
        d.id as doctor_id, d.first_name as doctor_first_name, d.last_name as doctor_last_name,
        d.specialization, d.license_number
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id AND u.role IN ('patient', 'staff')
      LEFT JOIN doctors d ON u.id = d.user_id AND u.role = 'doctor'
      WHERE u.id = $1
    `;
    
    const result = await this.query(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Search users by name or email
   * @param {string} searchTerm - Search term
   * @param {Object} options - Query options
   * @returns {Array} Matching users
   */
  async searchUsers(searchTerm, options = {}) {
    let query = `
      SELECT 
        u.id, u.email, u.username, u.role, u.phone_number, u.status, u.created_at, u.last_login_at,
        COALESCE(p.first_name, d.first_name) as first_name,
        COALESCE(p.last_name, d.last_name) as last_name
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE u.status = $1
    `;
    
    const values = [options.status || 'active'];
    let paramCount = 2;

    // Add role filtering
    if (options.roles && options.roles.length > 0) {
      const rolePlaceholders = options.roles.map(() => `$${paramCount++}`).join(',');
      query += ` AND u.role IN (${rolePlaceholders})`;
      values.push(...options.roles);
    }

    // Add user exclusion
    if (options.exclude_user_id) {
      query += ` AND u.id != $${paramCount}`;
      values.push(options.exclude_user_id);
      paramCount++;
    }

    // Add search term filtering
    if (searchTerm && searchTerm.trim()) {
      query += ` AND (
        u.email ILIKE $${paramCount} OR 
        u.username ILIKE $${paramCount} OR
        COALESCE(p.first_name, d.first_name) ILIKE $${paramCount} OR
        COALESCE(p.last_name, d.last_name) ILIKE $${paramCount} OR
        CONCAT(COALESCE(p.first_name, d.first_name), ' ', COALESCE(p.last_name, d.last_name)) ILIKE $${paramCount}
      )`;
      values.push(`%${searchTerm}%`);
      paramCount++;
    }

    query += ` ORDER BY u.last_login_at DESC NULLS LAST, u.created_at DESC`;

    // Add pagination
    if (options.limit) {
      query += ` LIMIT ${parseInt(options.limit)}`;
    }
    if (options.offset) {
      query += ` OFFSET ${parseInt(options.offset)}`;
    }


    const result = await this.query(query, values);
    return result.rows;
  }

  /**
   * Get user statistics
   * @returns {Object} User statistics
   */
  async getUserStats() {
    const query = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_users,
        COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_users,
        COUNT(CASE WHEN role = 'patient' THEN 1 END) as patients,
        COUNT(CASE WHEN role = 'doctor' THEN 1 END) as doctors,
        COUNT(CASE WHEN role = 'staff' THEN 1 END) as staff,
        COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users,
        COUNT(CASE WHEN phone_verified = true THEN 1 END) as phone_verified_users
      FROM ${this.tableName}
    `;
    
    const result = await this.query(query);
    return result.rows[0];
  }

  // ========================================
  // APPOINTMENT METHODS
  // ========================================

  /**
   * Find appointments by date for a specific doctor
   * @param {number} doctorId - Doctor ID
   * @param {string} date - Date in YYYY-MM-DD format
   * @returns {Array} Appointments for the date
   */
  async findAppointmentsByDate(doctorId, date) {
    const query = `
      SELECT 
        a.id,
        a.doctor_id,
        a.patient_id,
        a.appointment_date,
        a.appointment_time,
        a.duration_minutes,
        a.status,
        a.notes,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      WHERE a.doctor_id = $1 AND a.appointment_date = $2
      AND a.status NOT IN ('cancelled', 'no-show')
      ORDER BY a.appointment_time
    `;
    
    const result = await this.query(query, [doctorId, date]);
    return result.rows;
  }

  /**
   * Create a new appointment
   * @param {Object} appointmentData - Appointment data
   * @returns {Object} Created appointment
   */
  async createAppointment(appointmentData) {
    const query = `
      INSERT INTO appointments (
        doctor_id, patient_id, patient_user_id, patient_name, patient_phone, patient_email,
        appointment_date, appointment_time, appointment_datetime, appointment_type, location,
        reason_for_visit, additional_notes, duration_minutes, status,
        created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      appointmentData.doctor_id,
      appointmentData.patient_id || null,
      appointmentData.patient_user_id || null,
      appointmentData.patient_name,
      appointmentData.patient_phone,
      appointmentData.patient_email,
      appointmentData.appointment_date,
      appointmentData.appointment_time,
      appointmentData.appointment_datetime,
      appointmentData.appointment_type || 'consultation',
      appointmentData.location || 'Clinic',
      appointmentData.reason_for_visit,
      appointmentData.additional_notes,
      appointmentData.duration_minutes || 30,
      appointmentData.status || 'scheduled',
      appointmentData.created_by
    ];
    
    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Find appointment by ID
   * @param {number} appointmentId - Appointment ID
   * @returns {Object|null} Appointment data
   */
  async findAppointmentById(appointmentId) {
    const query = `
      SELECT 
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialization as doctor_specialization
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE a.id = $1
    `;
    
    const result = await this.query(query, [appointmentId]);
    return result.rows[0] || null;
  }

  /**
   * Update appointment by ID
   * @param {number} appointmentId - Appointment ID
   * @param {Object} updateData - Data to update
   * @returns {Object|null} Updated appointment
   */
  async updateAppointment(appointmentId, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(appointmentId);

    const query = `
      UPDATE appointments 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Check for appointment conflicts
   * @param {number} doctorId - Doctor ID
   * @param {Date} appointmentDateTime - Appointment datetime
   * @param {number} excludeAppointmentId - Appointment ID to exclude
   * @returns {boolean} True if there's a conflict
   */
  async checkAppointmentConflict(doctorId, appointmentDateTime, excludeAppointmentId = null) {
    let query = `
      SELECT COUNT(*) as count
      FROM appointments 
      WHERE doctor_id = $1 
      AND appointment_date = $2
      AND appointment_time = $3
      AND status NOT IN ('cancelled', 'no-show')
    `;
    
    const values = [
      doctorId,
      appointmentDateTime.toISOString().split('T')[0], // Date part
      appointmentDateTime.toTimeString().split(' ')[0]  // Time part
    ];

    if (excludeAppointmentId) {
      query += ` AND id != $4`;
      values.push(excludeAppointmentId);
    }

    const result = await this.query(query, values);
    return parseInt(result.rows[0].count) > 0;
  }

  /**
   * Find appointments by conditions
   * @param {Object} conditions - Search conditions
   * @param {Object} options - Query options
   * @returns {Array} Matching appointments
   */
  async findAppointmentsByConditions(conditions, options = {}) {
    let query = `
      SELECT 
        a.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        p.phone as patient_phone,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.specialization as doctor_specialization
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 1;

    // Add conditions (excluding patient-related fields which we handle specially)
    Object.keys(conditions).forEach(key => {
      if (conditions[key] !== undefined && 
          key !== 'date_range' && 
          key !== 'patient_user_id' && 
          key !== 'patient_email' && 
          key !== 'patient_id') {
        query += ` AND a.${key} = $${paramCount}`;
        values.push(conditions[key]);
        paramCount++;
      }
    });

    // Handle patient identification with comprehensive OR logic
    if (conditions.patient_id || conditions.patient_user_id || conditions.patient_email) {
      const patientConditions = [];
      
      if (conditions.patient_id) {
        patientConditions.push(`a.patient_id = $${paramCount}`);
        values.push(conditions.patient_id);
        paramCount++;
      }
      
      if (conditions.patient_user_id) {
        patientConditions.push(`a.patient_user_id = $${paramCount}`);
        values.push(conditions.patient_user_id);
        paramCount++;
      }
      
      if (conditions.patient_email) {
        patientConditions.push(`a.patient_email = $${paramCount}`);
        values.push(conditions.patient_email);
        paramCount++;
      }
      
      if (patientConditions.length > 0) {
        query += ` AND (${patientConditions.join(' OR ')})`;
      }
    }

    // Handle date range
    if (conditions.date_range) {
      if (conditions.date_range.start_date) {
        query += ` AND a.appointment_date >= $${paramCount}`;
        values.push(conditions.date_range.start_date);
        paramCount++;
      }
      if (conditions.date_range.end_date) {
        query += ` AND a.appointment_date <= $${paramCount}`;
        values.push(conditions.date_range.end_date);
        paramCount++;
      }
    }

    query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC`;

    // Add pagination
    if (options.limit) {
      query += ` LIMIT ${options.limit}`;
    }
    if (options.offset) {
      query += ` OFFSET ${options.offset}`;
    }


    const result = await this.query(query, values);
    database.info(' Query result:', { count: result.rows.length, appointments: result.rows });
    return result.rows;
  }

  /**
   * Count appointments by conditions
   * @param {Object} conditions - Search conditions
   * @returns {number} Count of matching appointments
   */
  async countAppointmentsByConditions(conditions) {
    let query = `
      SELECT COUNT(*) as count
      FROM appointments a
      WHERE 1=1
    `;
    
    const values = [];
    let paramCount = 1;

    // Add conditions (excluding patient-related fields which we handle specially)
    Object.keys(conditions).forEach(key => {
      if (conditions[key] !== undefined && 
          key !== 'date_range' && 
          key !== 'patient_user_id' && 
          key !== 'patient_email' && 
          key !== 'patient_id') {
        query += ` AND a.${key} = $${paramCount}`;
        values.push(conditions[key]);
        paramCount++;
      }
    });

    // Handle patient identification with comprehensive OR logic
    if (conditions.patient_id || conditions.patient_user_id || conditions.patient_email) {
      const patientConditions = [];
      
      if (conditions.patient_id) {
        patientConditions.push(`a.patient_id = $${paramCount}`);
        values.push(conditions.patient_id);
        paramCount++;
      }
      
      if (conditions.patient_user_id) {
        patientConditions.push(`a.patient_user_id = $${paramCount}`);
        values.push(conditions.patient_user_id);
        paramCount++;
      }
      
      if (conditions.patient_email) {
        patientConditions.push(`a.patient_email = $${paramCount}`);
        values.push(conditions.patient_email);
        paramCount++;
      }
      
      if (patientConditions.length > 0) {
        query += ` AND (${patientConditions.join(' OR ')})`;
      }
    }

    // Handle date range
    if (conditions.date_range) {
      if (conditions.date_range.start_date) {
        query += ` AND a.appointment_date >= $${paramCount}`;
        values.push(conditions.date_range.start_date);
        paramCount++;
      }
      if (conditions.date_range.end_date) {
        query += ` AND a.appointment_date <= $${paramCount}`;
        values.push(conditions.date_range.end_date);
        paramCount++;
      }
    }

    const result = await this.query(query, values);
    return parseInt(result.rows[0].count);
  }

  // ========================================
  // CHAT METHODS
  // ========================================

  /**
   * Find conversation between participants
   * @param {number} patientUserId - Patient User ID
   * @param {number} doctorUserId - Doctor User ID
   * @returns {Object|null} Existing conversation
   */
  async findConversationBetweenParticipants(patientUserId, doctorUserId) {
    const query = `
      SELECT c.* FROM conversations c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN doctors d ON c.doctor_id = d.id
      WHERE p.user_id = $1 AND d.user_id = $2 AND c.status = 'active'
      ORDER BY c.created_at DESC
      LIMIT 1
    `;
    
    const result = await this.query(query, [patientUserId, doctorUserId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new conversation
   * @param {Object} conversationData - Conversation data
   * @returns {Object} Created conversation
   */
  async createConversation(conversationData) {
    const query = `
      INSERT INTO conversations (
        patient_id, doctor_id, conversation_type, subject, priority, status,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      conversationData.patient_id,
      conversationData.doctor_id,
      conversationData.conversation_type || 'general',
      conversationData.subject,
      conversationData.priority || 'normal',
      conversationData.status || 'active'
    ];
    
    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Find conversation by ID
   * @param {number} conversationId - Conversation ID
   * @returns {Object|null} Conversation data
   */
  async findConversationById(conversationId) {
    const query = `
      SELECT 
        c.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM conversations c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN doctors d ON c.doctor_id = d.id
      WHERE c.id = $1
    `;
    
    const result = await this.query(query, [conversationId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new message
   * @param {Object} messageData - Message data
   * @returns {Object} Created message
   */
  async createMessage(messageData) {
    const query = `
      INSERT INTO messages (
        conversation_id, sender_id, sender_type, message_content, message_type,
        attachment_url, attachment_type, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;
    
    const values = [
      messageData.conversation_id,
      messageData.sender_id,
      messageData.sender_type,
      messageData.message_content,
      messageData.message_type || 'text',
      messageData.attachment_url,
      messageData.attachment_type
    ];
    
    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Update conversation last activity
   * @param {number} conversationId - Conversation ID
   * @returns {void}
   */
  async updateConversationLastActivity(conversationId) {
    const query = `
      UPDATE conversations 
      SET last_message_at = NOW(), updated_at = NOW()
      WHERE id = $1
    `;
    
    await this.query(query, [conversationId]);
  }

  /**
   * Find conversation messages
   * @param {Object} params - Query parameters
   * @returns {Object} Messages and total count
   */
  async findConversationMessages(params) {
    const { conversation_id, limit, offset } = params;
    
    const messagesQuery = `
      SELECT 
        m.*,
        u.email as sender_email,
        COALESCE(p.first_name, d.first_name) as sender_first_name,
        COALESCE(p.last_name, d.last_name) as sender_last_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      LEFT JOIN patients p ON m.sender_id = p.user_id AND m.sender_type = 'patient'
      LEFT JOIN doctors d ON m.sender_id = d.user_id AND m.sender_type = 'doctor'
      WHERE m.conversation_id = $1
      ORDER BY m.sent_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total FROM messages WHERE conversation_id = $1
    `;
    
    const [messagesResult, countResult] = await Promise.all([
      this.query(messagesQuery, [conversation_id, limit, offset]),
      this.query(countQuery, [conversation_id])
    ]);
    
    return {
      messages: messagesResult.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  /**
   * Mark messages as read
   * @param {number} conversationId - Conversation ID
   * @param {number} userId - User ID
   * @returns {void}
   */
  async markMessagesAsRead(conversationId, userId) {
    const query = `
      UPDATE messages 
      SET is_read = true, read_at = NOW()
      WHERE conversation_id = $1 AND sender_id != $2 AND is_read = false
    `;
    
    await this.query(query, [conversationId, userId]);
  }

  /**
   * Find user conversations
   * @param {Object} params - Query parameters
   * @returns {Object} Conversations and total count
   */
  async findUserConversations(params) {
    const { user_id, user_role, status, conversation_type, limit, offset } = params;
    
    let whereConditions = ['c.status = $1'];
    let queryParams = [status];
    let paramIndex = 2;
    
    // Role-based filtering - need to map user_id to patient_id/doctor_id
    if (user_role === 'patient') {
      whereConditions.push(`p.user_id = $${paramIndex}`);
      queryParams.push(user_id);
      paramIndex++;
    } else if (user_role === 'doctor') {
      whereConditions.push(`d.user_id = $${paramIndex}`);
      queryParams.push(user_id);
      paramIndex++;
    }
    // admin and staff can see all conversations
    
    if (conversation_type) {
      whereConditions.push(`c.conversation_type = $${paramIndex}`);
      queryParams.push(conversation_type);
      paramIndex++;
    }
    
    // Store the count of parameters for the WHERE clause (for count query)
    const whereParamsCount = queryParams.length;
    
    // Add user_id for unread count subquery
    const unreadCountParam = paramIndex;
    queryParams.push(user_id);
    paramIndex++;
    
    // Add limit and offset
    const limitParam = paramIndex;
    const offsetParam = paramIndex + 1;
    queryParams.push(limit, offset);
    
    const conversationsQuery = `
      SELECT 
        c.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        (SELECT message_content FROM messages WHERE conversation_id = c.id ORDER BY sent_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND is_read = false AND sender_id != $${unreadCountParam}) as unread_count
      FROM conversations c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN doctors d ON c.doctor_id = d.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY c.last_message_at DESC, c.updated_at DESC
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `;
    
    const countQuery = `
      SELECT COUNT(*) as total
      FROM conversations c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN doctors d ON c.doctor_id = d.id
      WHERE ${whereConditions.join(' AND ')}
    `;
    
    // Use only the parameters needed for WHERE clause in count query
    const countQueryParams = queryParams.slice(0, whereParamsCount);
    
    const [conversationsResult, countResult] = await Promise.all([
      this.query(conversationsQuery, queryParams),
      this.query(countQuery, countQueryParams)
    ]);
    
    return {
      conversations: conversationsResult.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  /**
   * Update conversation
   * @param {number} conversationId - Conversation ID
   * @param {Object} updateData - Data to update
   * @returns {Object|null} Updated conversation
   */
  async updateConversation(conversationId, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(conversationId);

    const query = `
      UPDATE conversations 
      SET ${fields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Check if user is participant in conversation by user_id
   * @param {number} userId - User ID
   * @param {number} conversationId - Conversation ID
   * @param {string} userRole - User role
   * @returns {boolean} Is participant
   */
  async isUserParticipantByUserId(userId, conversationId, userRole) {
    if (userRole === 'patient') {
      const query = `
        SELECT 1 FROM conversations c
        LEFT JOIN patients p ON c.patient_id = p.id
        WHERE c.id = $1 AND p.user_id = $2
      `;
      const result = await this.query(query, [conversationId, userId]);
      return result.rows.length > 0;
    } else if (userRole === 'doctor') {
      const query = `
        SELECT 1 FROM conversations c
        LEFT JOIN doctors d ON c.doctor_id = d.id
        WHERE c.id = $1 AND d.user_id = $2
      `;
      const result = await this.query(query, [conversationId, userId]);
      return result.rows.length > 0;
    } else if (['admin', 'staff'].includes(userRole)) {
      // Admin and staff can access all conversations
      return true;
    }
    
    return false;
  }

  /**
   * Find patient reports
   * @param {Object} params - Query parameters
   * @returns {Object} Reports and total count
   */
  async findPatientReports(params) {
    const {
      patient_id,
      report_type,
      status,
      sort_by = 'created_at',
      sort_order = 'desc',
      limit = 10,
      offset = 0
    } = params;

    let whereConditions = ['r.patient_id = $1'];
    let queryParams = [patient_id];
    let paramIndex = 2;

    if (report_type) {
      whereConditions.push(`r.report_type = $${paramIndex}`);
      queryParams.push(report_type);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`r.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reports r
      ${whereClause}
    `;
    
    const countResult = await this.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Main query
    const query = `
      SELECT 
        r.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM reports r
      LEFT JOIN patients p ON r.patient_id = p.id
      LEFT JOIN doctors d ON r.doctor_id = d.id
      ${whereClause}
      ORDER BY r.${sort_by} ${sort_order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await this.query(query, queryParams);

    return {
      reports: result.rows,
      total
    };
  }

  /**
   * Find doctor reports
   * @param {Object} params - Query parameters
   * @returns {Object} Reports and total count
   */
  async findDoctorReports(params) {
    const {
      doctor_id,
      patient_id,
      report_type,
      status,
      date_from,
      date_to,
      sort_by = 'created_at',
      sort_order = 'desc',
      limit = 10,
      offset = 0
    } = params;

    let whereConditions = ['r.doctor_id = $1'];
    let queryParams = [doctor_id];
    let paramIndex = 2;

    if (patient_id) {
      whereConditions.push(`r.patient_id = $${paramIndex}`);
      queryParams.push(patient_id);
      paramIndex++;
    }

    if (report_type) {
      whereConditions.push(`r.report_type = $${paramIndex}`);
      queryParams.push(report_type);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`r.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (date_from) {
      whereConditions.push(`r.created_at >= $${paramIndex}`);
      queryParams.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      whereConditions.push(`r.created_at <= $${paramIndex}`);
      queryParams.push(date_to);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reports r
      ${whereClause}
    `;
    
    const countResult = await this.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Main query
    const query = `
      SELECT 
        r.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM reports r
      LEFT JOIN patients p ON r.patient_id = p.id
      LEFT JOIN doctors d ON r.doctor_id = d.id
      ${whereClause}
      ORDER BY r.${sort_by} ${sort_order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await this.query(query, queryParams);

    return {
      reports: result.rows,
      total
    };
  }

  /**
   * Find report by ID
   * @param {number} reportId - Report ID
   * @returns {Object|null} Report with related data
   */
  async findReportById(reportId) {
    const query = `
      SELECT 
        r.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        p.email as patient_email,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        d.email as doctor_email
      FROM reports r
      LEFT JOIN patients p ON r.patient_id = p.id
      LEFT JOIN doctors d ON r.doctor_id = d.id
      WHERE r.id = $1
    `;
    
    const result = await this.query(query, [reportId]);
    return result.rows[0] || null;
  }

  /**
   * Create a new report
   * @param {Object} reportData - Report data
   * @returns {Object} Created report
   */
  async createReport(reportData) {
    const query = `
      INSERT INTO reports (
        patient_id, doctor_id, appointment_id, report_type, report_data, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      reportData.patient_id,
      reportData.doctor_id,
      reportData.appointment_id,
      reportData.report_type,
      reportData.report_data
    ];
    
    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Update report by ID
   * @param {number} reportId - Report ID
   * @param {Object} updateData - Update data
   * @returns {Object|null} Updated report
   */
  async updateReport(reportId, updateData) {
    const query = `
      UPDATE reports 
      SET report_data = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await this.query(query, [reportId, updateData.report_data]);
    return result.rows[0] || null;
  }
}

module.exports = UserRepository; 