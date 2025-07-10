const BaseRepository = require('./BaseRepository');
const { api, error: logError, info } = require('../utils/logger');

/**
 * Chat Repository
 * Handles all chat-related database operations
 */
class ChatRepository extends BaseRepository {
  constructor() {
    super('conversations');
  }

  /**
   * Create a new conversation
   * @param {Object} conversationData - Conversation data
   * @returns {Object} Created conversation
   */
  async createConversation(conversationData) {
    try {
      const conversation = await this.create(conversationData);
      api.info('Conversation created in repository:', { id: conversation.id });
      return conversation;
    } catch (error) {
      api.error('Error creating conversation in repository:', error);
      throw error;
    }
  }

  /**
   * Find conversation by ID
   * @param {string} conversationId - Conversation ID
   * @returns {Object|null} Conversation or null
   */
  async findConversationById(conversationId) {
    try {
      const query = `
        SELECT c.*, 
               d.first_name as doctor_first_name, d.last_name as doctor_last_name,
               p.first_name as patient_first_name, p.last_name as patient_last_name
        FROM conversations c
        LEFT JOIN doctors d ON c.doctor_id = d.id
        LEFT JOIN patients p ON c.patient_id = p.id
        WHERE c.conversation_id = $1
      `;
      
      const result = await this.query(query, [conversationId]);
      return result.rows[0] || null;
    } catch (error) {
      api.error('Error finding conversation by ID:', error);
      throw error;
    }
  }

  /**
   * Get conversations for a user
   * @param {Object} user - User object
   * @param {Object} options - Query options
   * @returns {Array} Conversations
   */
  async getUserConversations(user, options = {}) {
    try {
      const { limit = 20, offset = 0 } = options;
      
      let query = '';
      let params = [];
      
      if (user.role === 'doctor') {
        // Get conversations where user is the doctor
        query = `
          SELECT c.*, 
                 p.first_name as patient_first_name, p.last_name as patient_last_name,
                 p.email as patient_email
          FROM conversations c
          LEFT JOIN patients p ON c.patient_id = p.id
          WHERE c.doctor_id = (SELECT id FROM doctors WHERE user_id = $1)
          ORDER BY c.updated_at DESC
          LIMIT $2 OFFSET $3
        `;
        params = [user.id, limit, offset];
      } else if (user.role === 'patient') {
        // Get conversations where user is the patient
        query = `
          SELECT c.*, 
                 d.first_name as doctor_first_name, d.last_name as doctor_last_name,
                 d.email as doctor_email
          FROM conversations c
          LEFT JOIN doctors d ON c.doctor_id = d.id
          WHERE c.patient_id = (SELECT id FROM patients WHERE user_id = $1)
          ORDER BY c.updated_at DESC
          LIMIT $2 OFFSET $3
        `;
        params = [user.id, limit, offset];
      } else {
        // Admin/staff can see all conversations
        query = `
          SELECT c.*, 
                 d.first_name as doctor_first_name, d.last_name as doctor_last_name,
                 p.first_name as patient_first_name, p.last_name as patient_last_name
          FROM conversations c
          LEFT JOIN doctors d ON c.doctor_id = d.id
          LEFT JOIN patients p ON c.patient_id = p.id
          ORDER BY c.updated_at DESC
          LIMIT $1 OFFSET $2
        `;
        params = [limit, offset];
      }

      const result = await this.query(query, params);
      return result.rows;
    } catch (error) {
      api.error('Error getting user conversations:', error);
      throw error;
    }
  }

  /**
   * Update conversation status
   * @param {string} conversationId - Conversation ID
   * @param {string} status - New status
   * @returns {Object|null} Updated conversation or null
   */
  async updateConversationStatus(conversationId, status) {
    try {
      const query = `
        UPDATE conversations 
        SET status = $1, updated_at = NOW()
        WHERE conversation_id = $2
        RETURNING *
      `;
      
      const result = await this.query(query, [status, conversationId]);
      return result.rows[0] || null;
    } catch (error) {
      api.error('Error updating conversation status:', error);
      throw error;
    }
  }

  /**
   * Get messages for a conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} options - Query options
   * @returns {Array} Messages
   */
  async getConversationMessages(conversationId, options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;
      
      const query = `
        SELECT m.*, 
               CASE 
                 WHEN m.sender_type = 'doctor' THEN d.first_name || ' ' || d.last_name
                 WHEN m.sender_type = 'patient' THEN p.first_name || ' ' || p.last_name
                 ELSE 'Unknown'
               END as sender_name
        FROM messages m
        LEFT JOIN doctors d ON m.sender_type = 'doctor' AND m.sender_id = d.id
        LEFT JOIN patients p ON m.sender_type = 'patient' AND m.sender_id = p.id
        WHERE m.conversation_id = $1
        ORDER BY m.created_at ASC
        LIMIT $2 OFFSET $3
      `;
      
      const result = await this.query(query, [conversationId, limit, offset]);
      return result.rows;
    } catch (error) {
      api.error('Error getting conversation messages:', error);
      throw error;
    }
  }

  /**
   * Create a new message
   * @param {Object} messageData - Message data
   * @returns {Object} Created message
   */
  async createMessage(messageData) {
    try {
      const query = `
        INSERT INTO messages (
          conversation_id, content, sender_type, sender_id, 
          message_type, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `;
      
      const params = [
        messageData.conversation_id,
        messageData.content,
        messageData.sender_type,
        messageData.sender_id,
        messageData.message_type || 'text',
        messageData.status || 'sent'
      ];
      
      const result = await this.query(query, params);
      
      // Update conversation's updated_at timestamp
      await this.updateConversationTimestamp(messageData.conversation_id);
      
      return result.rows[0];
    } catch (error) {
      api.error('Error creating message:', error);
      throw error;
    }
  }

  /**
   * Update conversation timestamp
   * @param {string} conversationId - Conversation ID
   */
  async updateConversationTimestamp(conversationId) {
    try {
      const query = `
        UPDATE conversations 
        SET updated_at = NOW()
        WHERE conversation_id = $1
      `;
      
      await this.query(query, [conversationId]);
    } catch (error) {
      api.error('Error updating conversation timestamp:', error);
      throw error;
    }
  }

  /**
   * Get available users for chat based on role restrictions
   * @param {Object} user - Current user
   * @param {Object} options - Query options
   * @returns {Array} Available users
   */
  async getAvailableUsersForChat(user, options = {}) {
    try {
      const { role_filter } = options;
      
      let query = '';
      let params = [];
      
      if (user.role === 'doctor') {
        // Doctors can chat with their patients and other staff
        query = `
          SELECT 
            'patient' as type,
            p.user_id as id,
            p.first_name,
            p.last_name,
            p.email,
            p.phone
          FROM patients p
          WHERE p.status = 'active'
          AND p.id IN (
            SELECT DISTINCT patient_id 
            FROM appointments 
            WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = $1)
            AND patient_id IS NOT NULL
          )
          UNION ALL
          SELECT 
            'staff' as type,
            u.id,
            u.username as first_name,
            '' as last_name,
            u.email,
            u.phone_number as phone
          FROM users u
          WHERE u.role IN ('staff', 'admin')
          AND u.status = 'active'
          AND u.id != $1
        `;
        params = [user.id];
      } else if (user.role === 'patient') {
        // Patients can chat with any doctor, staff, and admin
        query = `
          SELECT 
            'doctor' as type,
            d.user_id as id,
            d.first_name,
            d.last_name,
            d.email,
            d.phone_number as phone
          FROM doctors d
          WHERE d.status = 'active'
          UNION ALL
          SELECT 
            'staff' as type,
            u.id,
            u.username as first_name,
            '' as last_name,
            u.email,
            u.phone_number as phone
          FROM users u
          WHERE u.role IN ('staff', 'admin')
          AND u.status = 'active'
        `;
        params = [];
      } else {
        // Admin/staff can chat with everyone
        query = `
          SELECT 
            'doctor' as type,
            d.user_id as id,
            d.first_name,
            d.last_name,
            d.email,
            d.phone_number as phone
          FROM doctors d
          WHERE d.status = 'active'
          UNION ALL
          SELECT 
            'patient' as type,
            p.user_id as id,
            p.first_name,
            p.last_name,
            p.email,
            p.phone
          FROM patients p
          WHERE p.status = 'active'
          UNION ALL
          SELECT 
            'staff' as type,
            u.id,
            u.username as first_name,
            '' as last_name,
            u.email,
            u.phone_number as phone
          FROM users u
          WHERE u.role IN ('staff', 'admin')
          AND u.status = 'active'
          AND u.id != $1
        `;
        params = [user.id];
      }

      const result = await this.query(query, params);
      return result.rows;
    } catch (error) {
      api.error('Error getting available users for chat:', error);
      throw error;
    }
  }

  /**
   * Get all staff, admin, and doctors for chat selection
   * @param {Object} options - Query options
   * @returns {Object} Staff, admin, and doctors
   */
  async getAllStaffAdminDoctors(options = {}) {
    try {
      const { limit = 100 } = options;
      
      const query = `
        SELECT 
          'doctor' as type,
          d.user_id as id,
          d.first_name,
          d.last_name,
          d.email,
          d.phone_number as phone,
          d.specialization
        FROM doctors d
        WHERE d.status = 'active'
        UNION ALL
        SELECT 
          'staff' as type,
          u.id,
          u.username as first_name,
          '' as last_name,
          u.email,
          u.phone_number as phone,
          u.role::text as specialization
        FROM users u
        WHERE u.role IN ('staff', 'admin')
        AND u.status = 'active'
        ORDER BY type, first_name, last_name
        LIMIT $1
      `;
      
      const result = await this.query(query, [limit]);
      return result.rows;
    } catch (error) {
      api.error('Error getting all staff admin doctors:', error);
      throw error;
    }
  }

  /**
   * Get conversations by conditions
   * @param {Object} conditions - Filter conditions
   * @returns {Array} Conversations
   */
  async getConversationsByConditions(conditions = {}) {
    try {
      const whereConditions = {};
      
      if (conditions.doctor_id) whereConditions.doctor_id = conditions.doctor_id;
      if (conditions.patient_id) whereConditions.patient_id = conditions.patient_id;
      if (conditions.participant_type) whereConditions.participant_type = conditions.participant_type;
      if (conditions.status) whereConditions.status = conditions.status;

      const whereClause = this.buildWhereClause(whereConditions);
      
      const query = `
        SELECT c.*, 
               d.first_name as doctor_first_name, d.last_name as doctor_last_name,
               p.first_name as patient_first_name, p.last_name as patient_last_name,
               (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.conversation_id) as message_count,
               (SELECT m.content FROM messages m WHERE m.conversation_id = c.conversation_id ORDER BY m.created_at DESC LIMIT 1) as last_message,
               (SELECT m.created_at FROM messages m WHERE m.conversation_id = c.conversation_id ORDER BY m.created_at DESC LIMIT 1) as last_message_at
        FROM conversations c
        LEFT JOIN doctors d ON c.doctor_id = d.id
        LEFT JOIN patients p ON c.patient_id = p.id
        ${whereClause.clause}
        ORDER BY c.updated_at DESC
      `;

      const result = await this.query(query, whereClause.params);
      return result.rows;
    } catch (error) {
      api.error('Error getting conversations by conditions:', error);
      throw error;
    }
  }

  /**
   * Find conversation between participants
   * @param {number} userId1 - First user ID
   * @param {number} userId2 - Second user ID
   * @returns {Object|null} Conversation or null
   */
  async findConversationBetweenParticipants(userId1, userId2) {
    try {
      const query = `
        SELECT c.* FROM conversations c
        WHERE c.status = 'active'
        AND (
          (c.doctor_id = (SELECT id FROM doctors WHERE user_id = $1) AND c.patient_id = (SELECT id FROM patients WHERE user_id = $2))
          OR (c.doctor_id = (SELECT id FROM doctors WHERE user_id = $2) AND c.patient_id = (SELECT id FROM patients WHERE user_id = $1))
        )
        LIMIT 1
      `;
      
      const result = await this.query(query, [userId1, userId2]);
      return result.rows[0] || null;
    } catch (error) {
      api.error('Error finding conversation between participants:', error);
      throw error;
    }
  }

  /**
   * Delete a conversation
   * @param {string} conversationId - Conversation ID
   * @returns {boolean} True if deleted
   */
  async deleteConversation(conversationId) {
    try {
      // Delete messages first
      await this.query('DELETE FROM messages WHERE conversation_id = $1', [conversationId]);
      
      // Delete conversation
      const result = await this.query(
        'DELETE FROM conversations WHERE conversation_id = $1 RETURNING id',
        [conversationId]
      );
      
      return result.rows.length > 0;
    } catch (error) {
      api.error('Error deleting conversation:', error);
      throw error;
    }
  }
}

module.exports = ChatRepository; 