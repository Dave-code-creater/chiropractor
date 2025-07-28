const BaseRepository = require('./base.repository');
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
        d.specialization
      FROM users u
      LEFT JOIN patients p ON u.id = p.user_id AND u.role = 'patient'
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
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin,
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
        a.status,
        a.additional_notes,
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
        doctor_id, patient_id, appointment_date, appointment_time, location,
        reason_for_visit, additional_notes, status,
        created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      appointmentData.doctor_id,
      appointmentData.patient_id,
      appointmentData.appointment_date,
      appointmentData.appointment_time,
      appointmentData.location || 'main_office',
      appointmentData.reason_for_visit,
      appointmentData.additional_notes,
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
        d.specialization as doctor_specialization,
        d.phone_number as doctor_phone,
        d.email as doctor_email
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
        key !== 'patient_id') {
        query += ` AND a.${key} = $${paramCount}`;
        values.push(conditions[key]);
        paramCount++;
      }
    });

    // Handle patient identification
    if (conditions.patient_id) {
      query += ` AND a.patient_id = $${paramCount}`;
      values.push(conditions.patient_id);
      paramCount++;
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
        key !== 'patient_id') {
        query += ` AND a.${key} = $${paramCount}`;
        values.push(conditions[key]);
        paramCount++;
      }
    });

    // Handle patient identification
    if (conditions.patient_id) {
      query += ` AND a.patient_id = $${paramCount}`;
      values.push(conditions.patient_id);
      paramCount++;
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
        conversation_id, patient_id, doctor_id, title, description, participant_type, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      conversationData.conversation_id,
      conversationData.patient_id,
      conversationData.doctor_id,
      conversationData.title || conversationData.subject || 'New Conversation',
      conversationData.description || '',
      conversationData.participant_type || 'patient-doctor',
      conversationData.status || 'active'
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Find conversation by ID
   * @param {string} conversationId - Conversation ID (conversation_id field)
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
      WHERE c.conversation_id = $1
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
        conversation_id, sender_id, sender_type, content, message_type,
        attachment_url, attachment_type, sent_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `;

    const values = [
      messageData.conversation_id,
      messageData.sender_id,
      messageData.sender_type,
      messageData.content,
      messageData.message_type || 'text',
      messageData.attachment_url,
      messageData.attachment_type
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Update conversation last activity
   * @param {string} conversationId - Conversation ID (conversation_id field)
   * @returns {void}
   */
  async updateConversationLastActivity(conversationId) {
    const query = `
      UPDATE conversations 
      SET last_message_at = NOW(), updated_at = NOW()
      WHERE conversation_id = $1
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
   * @param {string} conversationId - Conversation ID (conversation_id field)
   * @param {number} userId - User ID
   * @returns {void}
   */
  async markMessagesAsRead(conversationId, userId) {
    const query = `
      UPDATE messages 
      SET is_read = true, updated_at = NOW()
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
      whereConditions.push(`c.participant_type = $${paramIndex}`);
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
        (SELECT content FROM messages WHERE conversation_id = c.conversation_id ORDER BY sent_at DESC LIMIT 1) as last_message,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.conversation_id AND is_read = false AND sender_id != $${unreadCountParam}) as unread_count
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
  async isUserParticipantByUserId(userId, conversationId, userRole, profileId = null) {
    // Debug: Log the parameters
    console.log('isUserParticipantByUserId called with:', { userId, conversationId, userRole, profileId });

    // Check if user has sent messages in this conversation (most reliable way)
    const messageQuery = `
      SELECT 1 FROM messages WHERE conversation_id = $1 AND sender_id = $2 LIMIT 1
    `;
    const messageResult = await this.query(messageQuery, [conversationId, userId]);
    if (messageResult.rows.length > 0) {
      console.log('User has sent messages in this conversation, allowing access');
      return true;
    }

    // Use profile_id from JWT if available (most efficient)
    if (profileId) {
      if (userRole === 'patient') {
        const query = `
          SELECT 1 FROM conversations WHERE conversation_id = $1 AND patient_id = $2
        `;
        const result = await this.query(query, [conversationId, profileId]);
        console.log('Patient profile_id query result:', { conversationId, profileId, rows: result.rows.length });
        if (result.rows.length > 0) {
          return true;
        }
      } else if (userRole === 'doctor') {
        const query = `
          SELECT 1 FROM conversations WHERE conversation_id = $1 AND doctor_id = $2
        `;
        const result = await this.query(query, [conversationId, profileId]);
        console.log('Doctor profile_id query result:', { conversationId, profileId, rows: result.rows.length });
        if (result.rows.length > 0) {
          return true;
        }
      }
    }

    // Check if user is a participant based on patient_id/doctor_id (primary method)
    if (userRole === 'patient') {
      const query = `
        SELECT 1 FROM conversations c
        LEFT JOIN patients p ON c.patient_id = p.id
        WHERE c.conversation_id = $1 AND p.user_id = $2
      `;
      const result = await this.query(query, [conversationId, userId]);
      console.log('Patient query result:', { conversationId, userId, rows: result.rows.length });
      if (result.rows.length > 0) {
        return true;
      }
    } else if (userRole === 'doctor') {
      const query = `
        SELECT 1 FROM conversations c
        LEFT JOIN doctors d ON c.doctor_id = d.id
        WHERE c.conversation_id = $1 AND d.user_id = $2
      `;
      const result = await this.query(query, [conversationId, userId]);
      console.log('Doctor query result:', { conversationId, userId, rows: result.rows.length });
      if (result.rows.length > 0) {
        return true;
      }
    } else if (['admin', 'staff'].includes(userRole)) {
      // Admin and staff can access all conversations
      return true;
    }

    // Check if user can see this conversation in their conversation list (fallback)
    const userConversationQuery = `
      SELECT 1 FROM conversations c
      LEFT JOIN patients p ON c.patient_id = p.id
      LEFT JOIN doctors d ON c.doctor_id = d.id
      WHERE c.conversation_id = $1 AND (
        (p.user_id = $2) OR 
        (d.user_id = $2) OR
        ($3 IN ('admin', 'staff'))
      )
    `;
    const userConversationResult = await this.query(userConversationQuery, [conversationId, userId, userRole]);
    if (userConversationResult.rows.length > 0) {
      console.log('User can see this conversation in their list, allowing access');
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

  // ========================================
  // INCIDENTS METHODS
  // ========================================

  /**
   * Create a new incident
   * @param {Object} incidentData - Incident data
   * @returns {Object} Created incident
   */
  async createIncident(incidentData) {
    // Get the first active doctor from the database
    const doctorQuery = `
      SELECT id FROM doctors 
      WHERE status = 'active' 
      ORDER BY id ASC 
      LIMIT 1
    `;
    const doctorResult = await this.query(doctorQuery);
    const defaultDoctorId = doctorResult.rows[0]?.id;

    const query = `
      INSERT INTO incidents (
        user_id, patient_id, doctor_id, incident_type, title, description, date_occurred, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      incidentData.user_id,
      incidentData.patient_id,
      defaultDoctorId, // Hardcode the first active doctor
      incidentData.incident_type,
      incidentData.title,
      incidentData.description,
      incidentData.incident_date || incidentData.date_occurred,
      incidentData.status || 'active'
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get user incidents
   * @param {number} userId - User ID
   * @param {Object} options - Query options
   * @returns {Array} User incidents
   */
  async getUserIncidents(userId, options = {}) {
    const { status, incident_type, limit = 50, offset = 0 } = options;

    let whereConditions = [];
    let queryParams = [];
    let paramIndex = 1;

    // Check if user is a doctor
    const doctorQuery = `SELECT id FROM doctors WHERE user_id = $1 AND status = 'active'`;
    const doctorResult = await this.query(doctorQuery, [userId]);
    const isDoctor = doctorResult.rows.length > 0;
    const doctorId = doctorResult.rows[0]?.id;

    if (isDoctor) {
      // If user is a doctor, show incidents assigned to them
      whereConditions.push(`i.doctor_id = $${paramIndex}`);
      queryParams.push(doctorId);
      paramIndex++;
    } else {
      // If user is not a doctor, show only their own incidents
      whereConditions.push(`i.user_id = $${paramIndex}`);
      queryParams.push(userId);
      paramIndex++;
    }

    if (status) {
      whereConditions.push(`i.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (incident_type) {
      whereConditions.push(`i.incident_type = $${paramIndex}`);
      queryParams.push(incident_type);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        i.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        COUNT(if.id) as total_forms,
        COUNT(CASE WHEN if.is_completed = true THEN 1 END) as completed_forms
      FROM incidents i
      LEFT JOIN patients p ON i.patient_id = p.id
      LEFT JOIN doctors d ON i.doctor_id = d.id
      LEFT JOIN incident_forms if ON i.id = if.incident_id
      ${whereClause}
      GROUP BY i.id, p.first_name, p.last_name, d.first_name, d.last_name
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await this.query(query, queryParams);
    return result.rows;
  }

  /**
   * Get incident by ID
   * @param {number} incidentId - Incident ID
   * @returns {Object|null} Incident with forms and notes
   */
  async getIncidentById(incidentId) {
    const query = `
      SELECT 
        i.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name
      FROM incidents i
      LEFT JOIN patients p ON i.patient_id = p.id
      LEFT JOIN doctors d ON i.doctor_id = d.id
      WHERE i.id = $1
    `;

    const result = await this.query(query, [incidentId]);
    return result.rows[0] || null;
  }

  /**
   * Get incidents by patient ID
   * @param {number} patientId - Patient ID
   * @param {Object} options - Query options
   * @returns {Array} Patient incidents
   */
  async getIncidentsByPatientId(patientId, options = {}) {
    const { status, incident_type, limit = 50, offset = 0 } = options;

    let whereConditions = ['i.patient_id = $1'];
    let queryParams = [patientId];
    let paramIndex = 2;

    if (status) {
      whereConditions.push(`i.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (incident_type) {
      whereConditions.push(`i.incident_type = $${paramIndex}`);
      queryParams.push(incident_type);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        i.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        COUNT(if.id) as total_forms,
        COUNT(CASE WHEN if.is_completed = true THEN 1 END) as completed_forms
      FROM incidents i
      LEFT JOIN patients p ON i.patient_id = p.id
      LEFT JOIN doctors d ON i.doctor_id = d.id
      LEFT JOIN incident_forms if ON i.id = if.incident_id
      ${whereClause}
      GROUP BY i.id, p.first_name, p.last_name, d.first_name, d.last_name
      ORDER BY i.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const result = await this.query(query, queryParams);
    return result.rows;
  }

  /**
   * Get doctor's patients with incident counts
   * @param {number} doctorId - Doctor ID
   * @param {Object} options - Query options
   * @returns {Array} Doctor's patients
   */
  async getDoctorPatients(doctorId, options = {}) {
    const { limit = 50, offset = 0 } = options;

    const query = `
      WITH doctor_patients AS (
        SELECT DISTINCT p.id
        FROM patients p
        INNER JOIN incidents i ON p.id = i.patient_id
        WHERE i.doctor_id = $1
      )
      SELECT 
        p.id as patient_id,
        p.user_id,
        p.first_name,
        p.last_name,
        p.email,
        p.phone,
        p.status,
        p.created_at as patient_created_at,
        COUNT(i.id) as total_incidents,
        COUNT(CASE WHEN i.status = 'active' THEN 1 END) as active_incidents,
        MAX(i.created_at) as last_incident_date,
        json_agg(json_build_object(
          'id', i.id,
          'title', i.title,
          'incident_type', i.incident_type,
          'status', i.status,
          'created_at', i.created_at
        ) ORDER BY i.created_at DESC) as recent_incidents
      FROM doctor_patients dp
      INNER JOIN patients p ON p.id = dp.id
      LEFT JOIN incidents i ON p.id = i.patient_id AND i.doctor_id = $1
      GROUP BY p.id, p.user_id, p.first_name, p.last_name, p.email, p.phone, p.status, p.created_at
      ORDER BY MAX(i.created_at) DESC NULLS LAST
      LIMIT $2 OFFSET $3
    `;

    const result = await this.query(query, [doctorId, limit, offset]);
    return result.rows;
  }

  /**
   * Update incident
   * @param {number} incidentId - Incident ID
   * @param {Object} updateData - Update data
   * @returns {Object|null} Updated incident
   */
  async updateIncident(incidentId, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updateData[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) return null;

    fields.push('updated_at = NOW()');
    values.push(incidentId);

    const query = `
      UPDATE incidents 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Create or update incident form
   * @param {Object} formData - Form data
   * @returns {Object} Created/updated form
   */
  async createOrUpdateIncidentForm(formData) {
    try {
      // Ensure form_data is properly serialized for JSONB
      const serializedFormData = typeof formData.form_data === 'string'
        ? formData.form_data
        : JSON.stringify(formData.form_data || {});

      console.log('💾 Saving form data to DB:', {
        incident_id: formData.incident_id,
        form_type: formData.form_type,
        data_size: serializedFormData.length,
        is_completed: formData.is_completed
      });

      // First check if the form already exists
      const existingForm = await this.getIncidentFormByType(formData.incident_id, formData.form_type);

      if (existingForm) {
        console.log('📝 Updating existing form:', existingForm.id);
        // Update existing form
        const updateQuery = `
          UPDATE incident_forms 
          SET form_data = $1::jsonb, is_completed = $2, updated_at = NOW()
          WHERE incident_id = $3 AND form_type = $4
          RETURNING *
        `;

        const updateValues = [
          serializedFormData,
          formData.is_completed || false,
          formData.incident_id,
          formData.form_type
        ];

        const result = await this.query(updateQuery, updateValues);
        console.log('✅ Form updated successfully:', result.rows[0]?.id);
        return result.rows[0];
      } else {
        console.log('➕ Creating new form');
        // Create new form
        const insertQuery = `
          INSERT INTO incident_forms (
            incident_id, form_type, form_data, is_completed, is_required, created_at, updated_at
          ) VALUES ($1, $2, $3::jsonb, $4, $5, NOW(), NOW())
          RETURNING *
        `;

        const insertValues = [
          formData.incident_id,
          formData.form_type,
          serializedFormData,
          formData.is_completed || false,
          formData.is_required !== undefined ? formData.is_required : true
        ];

        const result = await this.query(insertQuery, insertValues);
        console.log('✅ Form created successfully:', result.rows[0]?.id);
        return result.rows[0];
      }
    } catch (error) {
      console.error('❌ Database error in createOrUpdateIncidentForm:', error);
      console.error('❌ Form data causing error:', {
        incident_id: formData.incident_id,
        form_type: formData.form_type,
        data_keys: formData.form_data ? Object.keys(formData.form_data) : 'null'
      });
      throw error;
    }
  }

  /**
   * Get incident forms
   * @param {number} incidentId - Incident ID
   * @returns {Array} Incident forms
   */
  async getIncidentForms(incidentId) {
    const query = `
      SELECT * FROM incident_forms 
      WHERE incident_id = $1 
      ORDER BY created_at ASC
    `;

    const result = await this.query(query, [incidentId]);
    return result.rows;
  }

  /**
   * Get incident form by type
   * @param {number} incidentId - Incident ID
   * @param {string} formType - Form type
   * @returns {Object|null} Form data
   */
  async getIncidentFormByType(incidentId, formType) {
    const query = `
      SELECT * FROM incident_forms 
      WHERE incident_id = $1 AND form_type = $2
    `;

    const result = await this.query(query, [incidentId, formType]);
    return result.rows[0] || null;
  }

  /**
   * Add incident note
   * @param {Object} noteData - Note data
   * @returns {Object} Created note
   */
  async addIncidentNote(noteData) {
    const query = `
      INSERT INTO incident_notes (
        incident_id, user_id, note_text, note_type, created_at
      ) VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
    `;

    const values = [
      noteData.incident_id,
      noteData.user_id,
      noteData.note_text,
      noteData.note_type || 'progress'
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get incident notes
   * @param {number} incidentId - Incident ID
   * @returns {Array} Incident notes
   */
  async getIncidentNotes(incidentId) {
    const query = `
      SELECT 
        n.*,
        u.username,
        u.email
      FROM incident_notes n
      LEFT JOIN users u ON n.user_id = u.id
      WHERE n.incident_id = $1 
      ORDER BY n.created_at DESC
    `;

    const result = await this.query(query, [incidentId]);
    return result.rows;
  }

  // ========================================
  // TREATMENT PLAN METHODS
  // ========================================

  /**
   * Create treatment plan
   * @param {Object} treatmentData - Treatment plan data
   * @returns {Object} Created treatment plan
   */
  async createTreatmentPlan(treatmentData) {
    const query = `
      INSERT INTO treatment_plans (
        incident_id, patient_id, doctor_id, diagnosis, treatment_goals, 
        additional_notes, status, created_by, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      treatmentData.incident_id,
      treatmentData.patient_id,
      treatmentData.doctor_id,
      treatmentData.diagnosis,
      treatmentData.treatment_goals,
      treatmentData.additional_notes,
      treatmentData.status,
      treatmentData.created_by
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Create treatment phase
   * @param {Object} phaseData - Treatment phase data
   * @returns {Object} Created treatment phase
   */
  async createTreatmentPhase(phaseData) {
    const query = `
      INSERT INTO treatment_phases (
        treatment_plan_id, phase_number, duration, duration_type, 
        frequency, frequency_type, description, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      phaseData.treatment_plan_id,
      phaseData.phase_number,
      phaseData.duration,
      phaseData.duration_type,
      phaseData.frequency,
      phaseData.frequency_type,
      phaseData.description,
      phaseData.status
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Get treatment plan by ID with phases
   * @param {number} treatmentPlanId - Treatment plan ID
   * @returns {Object} Treatment plan with phases
   */
  async getTreatmentPlanById(treatmentPlanId) {
    const query = `
      SELECT 
        tp.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        json_agg(
          json_build_object(
            'id', ph.id,
            'phase_number', ph.phase_number,
            'duration', ph.duration,
            'duration_type', ph.duration_type,
            'frequency', ph.frequency,
            'frequency_type', ph.frequency_type,
            'description', ph.description,
            'status', ph.status,
            'start_date', ph.start_date,
            'end_date', ph.end_date,
            'created_at', ph.created_at,
            'updated_at', ph.updated_at
          ) ORDER BY ph.phase_number
        ) as phases
      FROM treatment_plans tp
      LEFT JOIN patients p ON tp.patient_id = p.id
      LEFT JOIN doctors d ON tp.doctor_id = d.id
      LEFT JOIN treatment_phases ph ON tp.id = ph.treatment_plan_id
      WHERE tp.id = $1
      GROUP BY tp.id, p.first_name, p.last_name, d.first_name, d.last_name
    `;

    const result = await this.query(query, [treatmentPlanId]);
    return result.rows[0] || null;
  }

  /**
   * Get treatment plan by incident ID
   * @param {number} incidentId - Incident ID
   * @returns {Object} Treatment plan with phases
   */
  async getTreatmentPlanByIncidentId(incidentId) {
    const query = `
      SELECT 
        tp.*,
        p.first_name as patient_first_name,
        p.last_name as patient_last_name,
        d.first_name as doctor_first_name,
        d.last_name as doctor_last_name,
        json_agg(
          json_build_object(
            'id', ph.id,
            'phase_number', ph.phase_number,
            'duration', ph.duration,
            'duration_type', ph.duration_type,
            'frequency', ph.frequency,
            'frequency_type', ph.frequency_type,
            'description', ph.description,
            'status', ph.status,
            'start_date', ph.start_date,
            'end_date', ph.end_date,
            'created_at', ph.created_at,
            'updated_at', ph.updated_at
          ) ORDER BY ph.phase_number
        ) as phases
      FROM treatment_plans tp
      LEFT JOIN patients p ON tp.patient_id = p.id
      LEFT JOIN doctors d ON tp.doctor_id = d.id
      LEFT JOIN treatment_phases ph ON tp.id = ph.treatment_plan_id
      WHERE tp.incident_id = $1
      GROUP BY tp.id, p.first_name, p.last_name, d.first_name, d.last_name
    `;

    const result = await this.query(query, [incidentId]);
    return result.rows[0] || null;
  }

  /**
   * Update treatment plan
   * @param {number} treatmentPlanId - Treatment plan ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated treatment plan
   */
  async updateTreatmentPlan(treatmentPlanId, updateData) {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updateData[key]);
        paramIndex++;
      }
    });

    fields.push(`updated_at = NOW()`);
    values.push(treatmentPlanId);

    const query = `
      UPDATE treatment_plans 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Update incident completion percentage
   * @param {number} incidentId - Incident ID
   * @returns {Object|null} Updated incident
   */
  async updateIncidentCompletion(incidentId) {
    const query = `
      UPDATE incidents 
      SET completion_percentage = (
        SELECT CASE 
          WHEN COUNT(*) = 0 THEN 0
          ELSE (COUNT(CASE WHEN is_completed = true THEN 1 END) * 100 / COUNT(*))
        END
        FROM incident_forms 
        WHERE incident_id = $1
      ),
      updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.query(query, [incidentId]);
    return result.rows[0] || null;
  }

  /**
   * Delete incident
   * @param {number} incidentId - Incident ID
   * @returns {boolean} Success status
   */
  async deleteIncident(incidentId) {
    const query = `DELETE FROM incidents WHERE id = $1`;
    const result = await this.query(query, [incidentId]);
    return result.rowCount > 0;
  }

  /**
   * Create a patient intake report
   * @param {Object} data - Patient intake data
   * @returns {Object} Created intake report
   */
  async createIntakeReport(data, userId) {
    const query = `
      INSERT INTO patient_intake_responses (
        user_id, first_name, middle_name, last_name, ssn, date_of_birth,
        gender, marital_status, race, street, city, state, zip,
        home_phone, cell_phone, emergency_contact,
        emergency_contact_phone, emergency_contact_relationship
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,
        $13, $14, $15, $16, $17, $18
      ) RETURNING *
    `;

    const values = [
      userId,
      data.first_name,
      data.middle_name,
      data.last_name,
      data.ssn,
      data.date_of_birth,
      data.gender,
      data.marital_status,
      data.race,
      data.street,
      data.city,
      data.state,
      data.zip,
      data.home_phone,
      data.cell_phone,
      data.emergency_contact,
      data.emergency_contact_phone,
      data.emergency_contact_relationship
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  // ============================================
  // BLOG METHODS
  // ============================================

  /**
   * Create a new blog post
   * @param {Object} postData - Blog post data
   * @returns {Object} Created blog post
   */
  async createBlogPost(postData) {
    const {
      title,
      slug,
      content,
      excerpt,
      category,
      tags,
      status = 'draft',
      featured_image_url,
      meta_description,
      author_id
    } = postData;

    const query = `
      INSERT INTO blog_posts (
        title, slug, content, excerpt, category, tags, status, 
        featured_image_url, meta_description, author_id, published_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      title,
      slug,
      JSON.stringify(content),
      excerpt,
      category,
      JSON.stringify(tags || []),
      status,
      featured_image_url,
      meta_description,
      author_id,
      status === 'published' ? new Date() : null
    ];

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Find blog post by ID
   * @param {number} id - Blog post ID
   * @returns {Object|null} Blog post or null
   */
  async findBlogPostById(id) {
    const query = `
      SELECT bp.*, u.username, u.role,
             COALESCE(p.first_name, d.first_name) as first_name,
             COALESCE(p.last_name, d.last_name) as last_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      LEFT JOIN patients p ON u.id = p.user_id
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE bp.id = $1
    `;
    const result = await this.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find blog post by slug
   * @param {string} slug - Blog post slug
   * @returns {Object|null} Blog post or null
   */
  async findBlogPostBySlug(slug) {
    const query = `
      SELECT bp.*, u.username, u.role,
             COALESCE(p.first_name, d.first_name) as first_name,
             COALESCE(p.last_name, d.last_name) as last_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      LEFT JOIN patients p ON u.id = p.user_id
      LEFT JOIN doctors d ON u.id = d.user_id
      WHERE bp.slug = $1
    `;
    const result = await this.query(query, [slug]);
    return result.rows[0] || null;
  }

  /**
   * Find all blog posts with filters
   * @param {Object} filters - Search filters
   * @returns {Object} Posts and total count
   */
  async findAllBlogPosts(filters = {}) {
    const {
      status = 'published',
      category,
      author_id,
      tag,
      search,
      sort_by = 'created_at',
      sort_order = 'desc',
      limit = 10,
      offset = 0
    } = filters;

    let whereConditions = [];
    let queryParams = [];
    let paramCount = 1;

    // Status filter
    if (status) {
      whereConditions.push(`bp.status = $${paramCount}`);
      queryParams.push(status);
      paramCount++;
    }

    // Category filter
    if (category) {
      whereConditions.push(`bp.category = $${paramCount}`);
      queryParams.push(category);
      paramCount++;
    }

    // Author filter
    if (author_id) {
      whereConditions.push(`bp.author_id = $${paramCount}`);
      queryParams.push(author_id);
      paramCount++;
    }

    // Tag filter
    if (tag) {
      whereConditions.push(`bp.tags @> $${paramCount}`);
      queryParams.push(JSON.stringify([tag]));
      paramCount++;
    }

    // Search filter
    if (search) {
      whereConditions.push(`(bp.title ILIKE $${paramCount} OR bp.excerpt ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Validate sort_by field to prevent SQL injection
    const allowedSortFields = ['created_at', 'updated_at', 'published_at', 'title', 'view_count'];
    const safeSortBy = allowedSortFields.includes(sort_by) ? sort_by : 'created_at';
    const safeSortOrder = sort_order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Handle NULL values for published_at when sorting
    const orderBy = safeSortBy === 'published_at'
      ? `ORDER BY bp.${safeSortBy} ${safeSortOrder} NULLS LAST`
      : `ORDER BY bp.${safeSortBy} ${safeSortOrder}`;

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM blog_posts bp
      ${whereClause}
    `;

    // Posts query
    const postsQuery = `
      SELECT bp.*, u.username, u.role,
             COALESCE(p.first_name, d.first_name) as first_name,
             COALESCE(p.last_name, d.last_name) as last_name
      FROM blog_posts bp
      LEFT JOIN users u ON bp.author_id = u.id
      LEFT JOIN patients p ON u.id = p.user_id
      LEFT JOIN doctors d ON u.id = d.user_id
      ${whereClause}
      ${orderBy}
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    queryParams.push(limit, offset);

    const [countResult, postsResult] = await Promise.all([
      this.query(countQuery, queryParams.slice(0, -2)),
      this.query(postsQuery, queryParams)
    ]);

    return {
      posts: postsResult.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  /**
   * Update blog post
   * @param {number} id - Blog post ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated blog post
   */
  async updateBlogPost(id, updateData) {
    const allowedFields = [
      'title', 'slug', 'content', 'excerpt', 'category', 'tags',
      'status', 'featured_image_url', 'meta_description', 'published_at'
    ];

    const updates = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramCount}`);

        if (key === 'content' || key === 'tags') {
          values.push(JSON.stringify(value));
        } else {
          values.push(value);
        }
        paramCount++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    values.push(id);

    const query = `
      UPDATE blog_posts 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Delete blog post
   * @param {number} id - Blog post ID
   * @returns {boolean} Success status
   */
  async deleteBlogPost(id) {
    const query = 'DELETE FROM blog_posts WHERE id = $1';
    const result = await this.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Increment blog post view count
   * @param {number} id - Blog post ID
   * @returns {boolean} Success status
   */
  async incrementBlogPostViews(id) {
    const query = `
      UPDATE blog_posts 
      SET view_count = view_count + 1 
      WHERE id = $1
    `;
    const result = await this.query(query, [id]);
    return result.rowCount > 0;
  }

  /**
   * Get blog categories (from posts)
   * @returns {Array} Unique categories
   */
  async findBlogCategories() {
    const query = `
      SELECT DISTINCT category
      FROM blog_posts
      WHERE category IS NOT NULL
      ORDER BY category
    `;
    const result = await this.query(query);
    return result.rows.map(row => row.category);
  }
}

module.exports = UserRepository; 