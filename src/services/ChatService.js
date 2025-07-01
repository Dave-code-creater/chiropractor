const { BadRequestError, NotFoundError, ForbiddenError, InternalServerError } = require('../utils/httpResponses');
const { getUserRepository, getPatientRepository, getDoctorRepository } = require('../repositories');
const { messageValidator, sendMessageSchema } = require('../validators');
const { createConversationSchema } = require('../validators/chat.validator');
const { chat, error: logError, info } = require('../utils/logger');

/**
 * Chat Service
 * Static methods for chat and messaging business logic
 * 
 * Flow: [Controller] -> [Service] -> [Repository] -> [Database]
 */
class ChatService {
  /**
   * Create a new conversation with role-based restrictions
   * @param {Object} conversationData - Conversation creation data
   * @param {Object} req - Request object
   * @returns {Object} Conversation creation result
   */
  static async createConversation(conversationData, req) {
    const { error } = createConversationSchema.validate(conversationData);
    if (error) throw new BadRequestError(error.details[0].message, '4001');

    try {
      const userRepo = getUserRepository();
      const patientRepo = getPatientRepository();
      const doctorRepo = getDoctorRepository();

      const {
        target_user_id,
        conversation_type = 'consultation',
        subject,
        priority = 'normal'
      } = conversationData;

      const currentUser = req.user;
      


      // Enforce role-based conversation rules
      await ChatService.validateConversationRules(currentUser, target_user_id);

      // Get target user and resolve patient/doctor IDs
      const targetUser = await userRepo.findById(target_user_id);
      if (!targetUser) {
        throw new NotFoundError('Target user not found', '4044');
      }

      chat.info(' Target user found:', {
        target_user_id: targetUser.id,
        target_user_role: targetUser.role,
        target_user_email: targetUser.email
      });

      // Resolve participant IDs based on roles
      let patient_id = null;
      let doctor_id = null;
      let currentUserPatientId = null;
      let currentUserDoctorId = null;

      // Resolve current user's patient/doctor ID
      if (currentUser.role === 'patient') {
        const currentPatient = await patientRepo.findByUserId(currentUser.id);
        if (currentPatient) currentUserPatientId = currentPatient.id;
      } else if (currentUser.role === 'doctor') {
        const currentDoctor = await doctorRepo.findByUserId(currentUser.id);
        if (currentDoctor) currentUserDoctorId = currentDoctor.id;
      }

      // Resolve target user's patient/doctor ID
      if (targetUser.role === 'patient') {
        const targetPatient = await patientRepo.findByUserId(target_user_id);
        if (targetPatient) patient_id = targetPatient.id;
      } else if (targetUser.role === 'doctor') {
        const targetDoctor = await doctorRepo.findByUserId(target_user_id);
        if (targetDoctor) doctor_id = targetDoctor.id;
      }

      // Determine final patient_id and doctor_id for conversation
      if (currentUser.role === 'patient' && (targetUser.role === 'doctor' || targetUser.role === 'staff')) {
        patient_id = currentUserPatientId;
        if (targetUser.role === 'doctor') doctor_id = await ChatService.getDoctorIdByUserId(target_user_id);
      } else if ((currentUser.role === 'doctor' || currentUser.role === 'staff') && targetUser.role === 'patient') {
        if (currentUser.role === 'doctor') doctor_id = currentUserDoctorId;
        patient_id = await ChatService.getPatientIdByUserId(target_user_id);
      }

      // Check if conversation already exists between these participants
      const existingConversation = await userRepo.findConversationBetweenParticipants(
        currentUser.id, target_user_id
      );
      
      if (existingConversation && existingConversation.status === 'active') {
        chat.info(' Existing conversation found:', { conversation_id: existingConversation.id });
        return ChatService.formatConversationResponse(existingConversation);
      }

      // Create new conversation
      const conversation = await userRepo.createConversation({
        patient_id,
        doctor_id,
        conversation_type,
        subject,
        priority,
        status: 'active',
        created_by: currentUser.id
      });

      chat.info(' Conversation created:', { 
        conversation_id: conversation.id,
        patient_id,
        doctor_id,
        current_user_role: currentUser.role,
        target_user_role: targetUser.role
      });

      return ChatService.formatConversationResponse(conversation);

    } catch (error) {
      chat.error('Create conversation service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new InternalServerError('Failed to create conversation', '5001');
    }
  }

  /**
   * Send a message in a conversation
   * @param {Object} messageData - Message data
   * @param {Object} req - Request object
   * @returns {Object} Message creation result
   */
  static async sendMessage(messageData, req) {
    const { error } = messageValidator.validate(messageData);
    if (error) throw new BadRequestError(error.details[0].message, '4001');

    try {
      const userRepo = getUserRepository();

      const {
        conversation_id,
        message_content,
        message_type = 'text',
        attachment_url = null,
        attachment_type = null
      } = messageData;

      // Validate conversation exists and user has permission
      const conversation = await userRepo.findConversationById(conversation_id);
      if (!conversation) {
        throw new NotFoundError('Conversation not found', '4043');
      }

      // Check if user is a participant in the conversation
      const isParticipant = await ChatService.isUserParticipant(req.user.id, conversation_id, req.user.role);
      if (!isParticipant) {
        throw new ForbiddenError('You are not authorized to send messages in this conversation', '4033');
      }

      // Create message
      const message = await userRepo.createMessage({
        conversation_id,
        sender_id: req.user.id,
        sender_type: req.user.role,
        message_content,
        message_type,
        attachment_url,
        attachment_type,
        sent_at: new Date()
      });

      // Update conversation last activity
      await userRepo.updateConversationLastActivity(conversation_id);

      chat.info(' Message sent:', { 
        message_id: message.id,
        conversation_id,
        sender_id: req.user.id 
      });

      return ChatService.formatMessageResponse(message);

    } catch (error) {
      chat.error('Send message service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new InternalServerError('Failed to send message', '5002');
    }
  }

  /**
   * Get conversation by ID
   * @param {number} conversationId - Conversation ID
   * @param {Object} user - Current user
   * @returns {Object} Conversation details
   */
  static async getConversationById(conversationId, user) {
    try {
      const userRepo = getUserRepository();

      const conversation = await userRepo.findConversationById(conversationId);
      if (!conversation) {
        throw new NotFoundError('Conversation not found', '4043');
      }

      // Check if user has permission to view this conversation
      const isParticipant = await ChatService.isUserParticipant(user.id, conversationId, user.role);
      if (!isParticipant) {
        throw new ForbiddenError('You are not authorized to view this conversation', '4033');
      }

      chat.info(' Conversation retrieved:', { conversation_id: conversationId });

      return ChatService.formatConversationResponse(conversation);

    } catch (error) {
      chat.error('Get conversation service error:', error);
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new InternalServerError('Failed to retrieve conversation', '5003');
    }
  }

  /**
   * Get messages for a conversation
   * @param {number} conversationId - Conversation ID
   * @param {Object} query - Query parameters
   * @param {Object} user - Current user
   * @returns {Object} Messages list
   */
  static async getConversationMessages(conversationId, query, user) {
    try {
      const userRepo = getUserRepository();

      // Validate conversation exists and user has permission
      const conversation = await userRepo.findConversationById(conversationId);
      if (!conversation) {
        throw new NotFoundError('Conversation not found', '4043');
      }

      const isParticipant = await ChatService.isUserParticipant(user.id, conversationId, user.role);
      if (!isParticipant) {
        throw new ForbiddenError('You are not authorized to view messages in this conversation', '4033');
      }

      const {
        page = 1,
        limit = 20,
        before_message_id = null,
        after_message_id = null
      } = query;

      const offset = (page - 1) * limit;

      const result = await userRepo.findConversationMessages({
        conversation_id: conversationId,
        before_message_id,
        after_message_id,
        limit: parseInt(limit),
        offset
      });

      // Mark messages as read for current user
      await userRepo.markMessagesAsRead(conversationId, user.id);

      chat.info(' Messages retrieved:', { 
        conversation_id: conversationId,
        count: result.messages.length 
      });

      return {
        messages: result.messages.map(message => ChatService.formatMessageResponse(message)),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(result.total / limit),
          total_count: result.total,
          per_page: parseInt(limit),
          has_next: page * limit < result.total,
          has_prev: page > 1
        }
      };

    } catch (error) {
      chat.error('Get conversation messages service error:', error);
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new InternalServerError('Failed to retrieve messages', '5004');
    }
  }

  /**
   * Get user conversations
   * @param {Object} user - Current user
   * @param {Object} query - Query parameters
   * @returns {Object} Conversations list
   */
  static async getUserConversations(user, query = {}) {
    try {
      const userRepo = getUserRepository();

      const {
        page = 1,
        limit = 10,
        status = 'active',
        conversation_type = null
      } = query;

      const offset = (page - 1) * limit;

      const result = await userRepo.findUserConversations({
        user_id: user.id,
        user_role: user.role,
        status,
        conversation_type,
        limit: parseInt(limit),
        offset
      });

      chat.info(' User conversations retrieved:', { 
        user_id: user.id,
        count: result.conversations.length 
      });

      return {
        conversations: result.conversations.map(conversation => 
          ChatService.formatConversationResponse(conversation)
        ),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(result.total / limit),
          total_count: result.total,
          per_page: parseInt(limit),
          has_next: page * limit < result.total,
          has_prev: page > 1
        }
      };

    } catch (error) {
      chat.error('Get user conversations service error:', error);
      throw new InternalServerError('Failed to retrieve conversations', '5005');
    }
  }

  /**
   * Update conversation status
   * @param {number} conversationId - Conversation ID
   * @param {string} status - New status
   * @param {Object} user - Current user
   * @returns {Object} Updated conversation
   */
  static async updateConversationStatus(conversationId, status, user) {
    try {
      const userRepo = getUserRepository();

      const conversation = await userRepo.findConversationById(conversationId);
      if (!conversation) {
        throw new NotFoundError('Conversation not found', '4043');
      }

      // Only doctors and staff can close conversations
      if (status === 'closed' && !['doctor', 'admin', 'staff'].includes(user.role)) {
        throw new ForbiddenError('You are not authorized to close conversations', '4033');
      }

      const updatedConversation = await userRepo.updateConversation(conversationId, {
        status,
        updated_at: new Date()
      });

      chat.info(' Conversation status updated:', { 
        conversation_id: conversationId,
        status 
      });

      return ChatService.formatConversationResponse(updatedConversation);

    } catch (error) {
      chat.error('Update conversation status service error:', error);
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new InternalServerError('Failed to update conversation status', '5006');
    }
  }

  /**
   * Validate conversation rules based on user roles
   * @param {Object} currentUser - Current user making the request
   * @param {number} targetUserId - Target user ID for conversation
   * @throws {ForbiddenError} If conversation is not allowed
   */
  static async validateConversationRules(currentUser, targetUserId) {
    const userRepo = getUserRepository();
    const targetUser = await userRepo.findById(targetUserId);
    
    if (!targetUser) {
      throw new NotFoundError('Target user not found', '4044');
    }

    const currentRole = currentUser.role;
    const targetRole = targetUser.role;

    chat.info('🔒 Validating conversation rules:', {
      current_role: currentRole,
      target_role: targetRole
    });

    // Rule 1: Patients can only chat with doctors, staff, or admin
    if (currentRole === 'patient') {
      if (!['doctor', 'staff', 'admin'].includes(targetRole)) {
        throw new ForbiddenError('Patients can only start conversations with doctors, staff, or administrators', '4031');
      }
    }

    // Rule 2: Doctors and staff can chat with patients, other doctors/staff, or admin
    if (['doctor', 'staff'].includes(currentRole)) {
      if (!['patient', 'doctor', 'staff', 'admin'].includes(targetRole)) {
        throw new ForbiddenError('Invalid conversation target', '4032');
      }
    }

    // Rule 3: Admin can chat with anyone
    if (currentRole === 'admin') {
      // Admin has no restrictions
      return true;
    }

    // Rule 4: Prevent patient-to-patient conversations (redundant check but explicit)
    if (currentRole === 'patient' && targetRole === 'patient') {
      throw new ForbiddenError('Patients cannot start conversations with other patients', '4033');
    }

    chat.info(' Conversation rules validated successfully');
    return true;
  }

  /**
   * Get doctor ID by user ID
   * @param {number} userId - User ID
   * @returns {number|null} Doctor ID
   */
  static async getDoctorIdByUserId(userId) {
    const doctorRepo = getDoctorRepository();
    const doctor = await doctorRepo.findByUserId(userId);
    return doctor ? doctor.id : null;
  }

  /**
   * Get patient ID by user ID
   * @param {number} userId - User ID
   * @returns {number|null} Patient ID
   */
  static async getPatientIdByUserId(userId) {
    const patientRepo = getPatientRepository();
    const patient = await patientRepo.findByUserId(userId);
    return patient ? patient.id : null;
  }

  /**
   * Get available users for chat based on role restrictions
   * @param {Object} currentUser - Current user
   * @param {Object} query - Query parameters
   * @returns {Object} Available users list
   */
  static async getAvailableUsersForChat(currentUser, query = {}) {
    try {
      const userRepo = getUserRepository();
      const { search = '', limit = 20 } = query;

      let allowedRoles = [];

      // Determine which user roles the current user can chat with
      switch (currentUser.role) {
        case 'patient':
          allowedRoles = ['doctor', 'staff', 'admin'];
          break;
        case 'doctor':
        case 'staff':
          allowedRoles = ['patient', 'doctor', 'staff', 'admin'];
          break;
        case 'admin':
          allowedRoles = ['patient', 'doctor', 'staff', 'admin'];
          break;
        default:
          allowedRoles = [];
      }

      chat.debug(' Getting available users for chat:', {
        current_user_role: currentUser.role,
        allowed_roles: allowedRoles,
        search_term: search
      });

      // Get users based on allowed roles
      const users = await userRepo.searchUsers(search, {
        roles: allowedRoles,
        exclude_user_id: currentUser.id, // Don't include self
        limit: parseInt(limit),
        status: 'active'
      });

      chat.info(' Available users found:', { count: users.length });

      return {
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          full_name: user.full_name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          status: user.status,
          last_login_at: user.last_login_at
        })),
        total: users.length,
        allowed_roles: allowedRoles
      };

    } catch (error) {
      chat.error('Get available users for chat error:', error);
      throw new InternalServerError('Failed to get available users', '5007');
    }
  }

  /**
   * Get staff, admin, and doctors for chat selection with role filtering
   * @param {Object} query - Query parameters
   * @returns {Object} Users organized by role or filtered by specific role
   */
  static async getAllStaffAdminDoctors(query = {}) {
    try {
      const userRepo = getUserRepository();
      const { search = '', limit = 100, role = 'all' } = query;

      // Determine target roles based on role parameter
      let targetRoles = [];
      let shouldOrganizeByRole = true;

      if (role === 'all') {
        targetRoles = ['staff', 'admin', 'doctor'];
        shouldOrganizeByRole = true;
      } else if (role === 'doctor') {
        targetRoles = ['doctor'];
        shouldOrganizeByRole = false;
      } else if (role === 'staff') {
        targetRoles = ['staff'];
        shouldOrganizeByRole = false;
      } else if (role === 'admin') {
        targetRoles = ['admin'];
        shouldOrganizeByRole = false;
      } else {
        // Invalid role parameter, default to all
        targetRoles = ['staff', 'admin', 'doctor'];
        shouldOrganizeByRole = true;
      }

      chat.debug(' Getting healthcare professionals:', {
        requested_role: role,
        target_roles: targetRoles,
        search_term: search,
        organize_by_role: shouldOrganizeByRole
      });

      // Get users with specified roles
      const users = await userRepo.searchUsers(search, {
        roles: targetRoles,
        limit: parseInt(limit),
        status: 'active'
      });

      if (shouldOrganizeByRole) {
        // Organize users by role (when role = 'all')
        const organizedUsers = {
          doctors: [],
          staff: [],
          admin: []
        };

        users.forEach(user => {
          const userInfo = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            first_name: user.first_name,
            last_name: user.last_name,
            full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
            status: user.status,
            last_login_at: user.last_login_at
          };

          switch (user.role) {
            case 'doctor':
              organizedUsers.doctors.push(userInfo);
              break;
            case 'staff':
              organizedUsers.staff.push(userInfo);
              break;
            case 'admin':
              organizedUsers.admin.push(userInfo);
              break;
          }
        });

        const totalCount = organizedUsers.doctors.length + organizedUsers.staff.length + organizedUsers.admin.length;

        chat.info(' Healthcare professionals found (organized):', { 
          doctors: organizedUsers.doctors.length,
          staff: organizedUsers.staff.length,
          admin: organizedUsers.admin.length,
          total: totalCount
        });

        return {
          role_filter: role,
          data: organizedUsers,
          summary: {
            total_doctors: organizedUsers.doctors.length,
            total_staff: organizedUsers.staff.length,
            total_admin: organizedUsers.admin.length,
            total_count: totalCount
          }
        };
      } else {
        // Return flat list for specific role
        const userList = users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          status: user.status,
          last_login_at: user.last_login_at
        }));

        chat.info(`✅ ${role}s found:`, { 
          role: role,
          count: userList.length
        });

        return {
          role_filter: role,
          data: userList,
          summary: {
            total_count: userList.length,
            filtered_role: role
          }
        };
      }

    } catch (error) {
      chat.error('Get healthcare professionals error:', error);
      throw new InternalServerError('Failed to get healthcare professionals', '5008');
    }
  }

  /**
   * Check if user is participant in conversation
   * @param {number} userId - User ID
   * @param {number} conversationId - Conversation ID
   * @param {string} userRole - User role
   * @returns {boolean} Is participant
   */
  static async isUserParticipant(userId, conversationId, userRole) {
    try {
      const userRepo = getUserRepository();
      return await userRepo.isUserParticipantByUserId(userId, conversationId, userRole);
    } catch (error) {
      chat.error('Check user participant error:', error);
      return false;
    }
  }

  /**
   * Format conversation response
   * @param {Object} conversation - Raw conversation data
   * @returns {Object} Formatted conversation
   */
  static formatConversationResponse(conversation) {
    if (!conversation) return null;

    return {
      id: conversation.id,
      patient_id: conversation.patient_id,
      patient_name: conversation.patient_name || 
        `${conversation.patient_first_name} ${conversation.patient_last_name}`,
      doctor_id: conversation.doctor_id,
      doctor_name: conversation.doctor_name || 
        `${conversation.doctor_first_name} ${conversation.doctor_last_name}`,
      conversation_type: conversation.conversation_type,
      subject: conversation.subject,
      priority: conversation.priority,
      status: conversation.status,
      last_message: conversation.last_message,
      last_message_at: conversation.last_message_at,
      unread_count: conversation.unread_count || 0,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at
    };
  }

  /**
   * Format message response
   * @param {Object} message - Raw message data
   * @returns {Object} Formatted message
   */
  static formatMessageResponse(message) {
    if (!message) return null;

    return {
      id: message.id,
      conversation_id: message.conversation_id,
      sender_id: message.sender_id,
      sender_type: message.sender_type,
      sender_name: message.sender_name || 
        `${message.sender_first_name} ${message.sender_last_name}`,
      message_content: message.message_content,
      message_type: message.message_type,
      attachment_url: message.attachment_url,
      attachment_type: message.attachment_type,
      is_read: message.is_read,
      sent_at: message.sent_at,
      read_at: message.read_at
    };
  }
}

module.exports = ChatService; 