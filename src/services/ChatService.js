const { BadRequestError, NotFoundError, ForbiddenError, InternalServerError } = require('../utils/httpResponses');
const { getUserRepository, getPatientRepository, getDoctorRepository, getChatRepository } = require('../repositories');
const { sendMessageSchema } = require('../validators').schemas;
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
        if (currentPatient) {
          currentUserPatientId = currentPatient.id;
          chat.info('Current user patient found:', { user_id: currentUser.id, patient_id: currentPatient.id });
        } else {
          chat.warn('Current user patient not found:', { user_id: currentUser.id });
        }
      } else if (currentUser.role === 'doctor') {
        const currentDoctor = await doctorRepo.findByUserId(currentUser.id);
        if (currentDoctor) {
          currentUserDoctorId = currentDoctor.id;
          chat.info('Current user doctor found:', { user_id: currentUser.id, doctor_id: currentDoctor.id });
        } else {
          chat.warn('Current user doctor not found:', { user_id: currentUser.id });
        }
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
      // Handle all possible role combinations
      if (currentUser.role === 'patient' && targetUser.role === 'doctor') {
        // Patient creating conversation with doctor
        patient_id = currentUserPatientId;
        doctor_id = await ChatService.getDoctorIdByUserId(target_user_id);
        chat.info('Patient creating conversation with doctor:', {
          current_user_role: currentUser.role,
          target_user_role: targetUser.role,
          patient_id,
          doctor_id
        });
      } else if (currentUser.role === 'doctor' && targetUser.role === 'patient') {
        // Doctor creating conversation with patient
        doctor_id = currentUserDoctorId;
        patient_id = await ChatService.getPatientIdByUserId(target_user_id);
        chat.info('Doctor creating conversation with patient:', {
          current_user_role: currentUser.role,
          target_user_role: targetUser.role,
          patient_id,
          doctor_id
        });
      } else if (currentUser.role === 'patient' && (targetUser.role === 'staff' || targetUser.role === 'admin')) {
        // Patient creating conversation with staff/admin
        patient_id = currentUserPatientId;
        // For staff/admin conversations, we don't set doctor_id as they're not doctors
        chat.info('Patient creating conversation with staff/admin:', {
          current_user_role: currentUser.role,
          target_user_role: targetUser.role,
          patient_id,
          doctor_id
        });
      } else if ((currentUser.role === 'staff' || currentUser.role === 'admin') && targetUser.role === 'patient') {
        // Staff/admin creating conversation with patient
        patient_id = await ChatService.getPatientIdByUserId(target_user_id);
        // For staff/admin conversations, we don't set doctor_id as they're not doctors
        chat.info('Staff/admin creating conversation with patient:', {
          current_user_role: currentUser.role,
          target_user_role: targetUser.role,
          patient_id,
          doctor_id
        });
      } else if (currentUser.role === 'doctor' && (targetUser.role === 'staff' || targetUser.role === 'admin')) {
        // Doctor creating conversation with staff/admin
        doctor_id = currentUserDoctorId;
        // For staff/admin conversations, we don't set patient_id as they're not patients
        chat.info('Doctor creating conversation with staff/admin:', {
          current_user_role: currentUser.role,
          target_user_role: targetUser.role,
          patient_id,
          doctor_id
        });
      } else if ((currentUser.role === 'staff' || currentUser.role === 'admin') && targetUser.role === 'doctor') {
        // Staff/admin creating conversation with doctor
        doctor_id = await ChatService.getDoctorIdByUserId(target_user_id);
        // For staff/admin conversations, we don't set patient_id as they're not patients
        chat.info('Staff/admin creating conversation with doctor:', {
          current_user_role: currentUser.role,
          target_user_role: targetUser.role,
          patient_id,
          doctor_id
        });
      } else {
        // Handle any other role combinations (patient-patient, doctor-doctor, etc.)
        // For now, we'll set both to null and let the conversation be created
        // but this might need to be restricted based on business rules
        chat.warn('Unsupported role combination for conversation:', {
          current_user_role: currentUser.role,
          target_user_role: targetUser.role,
          patient_id,
          doctor_id
        });
      }

      // Check if conversation already exists between these participants
      const chatRepo = getChatRepository();
      const existingConversation = await chatRepo.findConversationBetweenParticipants(
        currentUser.id, target_user_id
      );
      
      if (existingConversation && existingConversation.status === 'active') {
        chat.info(' Existing conversation found:', { conversation_id: existingConversation.id });
        return ChatService.formatConversationResponse(existingConversation);
      }

      // Create new conversation
      const conversation = await chatRepo.createConversation({
        conversation_id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        patient_id,
        doctor_id,
        title: subject || 'New Conversation',
        description: '',
        participant_type: 'patient-doctor',
        status: 'active'
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
    const { error } = sendMessageSchema.validate(messageData);
    if (error) throw new BadRequestError(error.details[0].message, '4001');

    try {
      const chatRepo = getChatRepository();

      const {
        conversation_id,
        content,
        message_content,
        message_type = 'text'
      } = messageData;

      // Use content if message_content is not provided
      const finalMessageContent = message_content || content;

      // Validate conversation exists and user has permission
      const conversation = await chatRepo.findConversationById(conversation_id);
      if (!conversation) {
        throw new NotFoundError('Conversation not found', '4043');
      }

      // Check if user is a participant in the conversation
      const isParticipant = await ChatService.isUserParticipant(req.user.id, conversation_id, req.user.role, req.user.profile_id);
      if (!isParticipant) {
        throw new ForbiddenError('You are not authorized to send messages in this conversation', '4033');
      }

      // Create message
      const message = await chatRepo.createMessage({
        conversation_id,
        sender_id: req.user.id,
        sender_type: req.user.role,
        content: finalMessageContent,
        message_type,
        sent_at: new Date()
      });

      // Update conversation last activity
      await chatRepo.updateConversationTimestamp(conversation_id);

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
      const chatRepo = getChatRepository();

      const conversation = await chatRepo.findConversationById(conversationId);
      if (!conversation) {
        throw new NotFoundError('Conversation not found', '4043');
      }

      // Check if user has permission to view this conversation
      const isParticipant = await ChatService.isUserParticipant(user.id, conversationId, user.role, user.profile_id);
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

      const isParticipant = await ChatService.isUserParticipant(user.id, conversationId, user.role, user.profile_id);
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
      const chatRepo = getChatRepository();

      const {
        page = 1,
        limit = 10,
        status = 'active'
      } = query;

      const offset = (page - 1) * limit;

      const conversations = await chatRepo.getUserConversations(user, {
        limit: parseInt(limit),
        offset
      });

      chat.info(' User conversations retrieved:', { 
        user_id: user.id,
        count: conversations.length 
      });

      return {
        conversations: conversations.map(conversation => 
          ChatService.formatConversationResponse(conversation)
        ),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(conversations.length / limit),
          total_count: conversations.length,
          per_page: parseInt(limit),
          has_next: page * limit < conversations.length,
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
      const chatRepo = getChatRepository();

      const conversation = await chatRepo.findConversationById(conversationId);
      if (!conversation) {
        throw new NotFoundError('Conversation not found', '4043');
      }

      // Only doctors and staff can close conversations
      if (status === 'closed' && !['doctor', 'admin', 'staff'].includes(user.role)) {
        throw new ForbiddenError('You are not authorized to close conversations', '4033');
      }

      const updatedConversation = await chatRepo.updateConversationStatus(conversationId, status);

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
   * Get conversations with filtering
   * @param {Object} query - Query parameters
   * @param {Object} user - Current user
   * @returns {Array} Conversations
   */
  static async getConversations(query, user) {
    try {
      const { doctor_id, patient_id, participant_type } = query;
      
      const chatRepo = getChatRepository();
      
      // Build conditions based on query parameters and user role
      const conditions = {};
      
      if (doctor_id) conditions.doctor_id = parseInt(doctor_id);
      if (patient_id) conditions.patient_id = parseInt(patient_id);
      if (participant_type) conditions.participant_type = participant_type;
      
      // Add role-based filtering
      if (user.role === 'doctor') {
        const doctorRepo = getDoctorRepository();
        const doctor = await doctorRepo.findByUserId(user.id);
        if (doctor) {
          conditions.doctor_id = doctor.id;
        }
      } else if (user.role === 'patient') {
        const patientRepo = getPatientRepository();
        const patient = await patientRepo.findByUserId(user.id);
        if (patient) {
          conditions.patient_id = patient.id;
        }
      }
      // Admin and staff can see all conversations (no additional filtering)
      
      const conversations = await chatRepo.getConversationsByConditions(conditions);
      
      return conversations.map(conversation => 
        ChatService.formatConversationResponse(conversation)
      );
      
    } catch (error) {
      chat.error('Get conversations service error:', error);
      throw new InternalServerError('Failed to retrieve conversations', '5010');
    }
  }

  /**
   * Get available users for chat based on role restrictions
   * @param {Object} currentUser - Current user
   * @param {Object} query - Query parameters
   * @returns {Object} Available users list
   */
  static async getAvailableUsersForChat(currentUser, query = {}) {
    try {
      const chatRepo = getChatRepository();
      const { search = '', limit = 20 } = query;

      chat.debug(' Getting available users for chat:', {
        current_user_role: currentUser.role,
        search_term: search
      });

      // Get available users from repository
      const users = await chatRepo.getAvailableUsersForChat(currentUser, {
        limit: parseInt(limit)
      });

      chat.info(' Available users found:', { count: users.length });

      return {
        users: users.map(user => ({
          id: user.id,
          type: user.type,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          specialization: user.specialization
        })),
        total: users.length
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
      const chatRepo = getChatRepository();
      const { limit = 100 } = query;

      chat.debug(' Getting healthcare professionals:', {
        limit: limit
      });

      // Get healthcare professionals from repository
      const users = await chatRepo.getAllStaffAdminDoctors({
        limit: parseInt(limit)
      });

      // Organize users by type
      const organizedUsers = {
        doctors: [],
        staff: []
      };

      users.forEach(user => {
        const userInfo = {
          id: user.id,
          type: user.type,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone,
          full_name: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          specialization: user.specialization
        };

        switch (user.type) {
          case 'doctor':
            organizedUsers.doctors.push(userInfo);
            break;
          case 'staff':
            organizedUsers.staff.push(userInfo);
            break;
        }
      });

      const totalCount = organizedUsers.doctors.length + organizedUsers.staff.length;

      chat.info(' Healthcare professionals found:', { 
        doctors: organizedUsers.doctors.length,
        staff: organizedUsers.staff.length,
        total: totalCount
      });

      return {
        data: organizedUsers,
        summary: {
          total_doctors: organizedUsers.doctors.length,
          total_staff: organizedUsers.staff.length,
          total_count: totalCount
        }
      };

    } catch (error) {
      chat.error('Get healthcare professionals error:', error);
      throw new InternalServerError('Failed to get healthcare professionals', '5008');
    }
  }

  /**
   * Create doctor-patient conversation with initial message
   * @param {Object} conversationData - Conversation data
   * @param {Object} req - Request object
   * @returns {Object} Created conversation with initial message
   */
  static async createDoctorPatientConversation(conversationData, req) {
    try {
      const { doctor_id, patient_id, title, initial_message } = conversationData;
      
      // Validate doctor exists
      const doctorRepo = getDoctorRepository();
      const doctor = await doctorRepo.findById(doctor_id);
      if (!doctor || doctor.status !== 'active') {
        throw new NotFoundError('Doctor not found', '4041');
      }

      // Validate patient exists if provided
      let patient = null;
      if (patient_id) {
        const patientRepo = getPatientRepository();
        patient = await patientRepo.findById(patient_id);
        if (!patient || patient.status !== 'active') {
          throw new NotFoundError('Patient not found', '4042');
        }
      }

      // Create conversation
      const chatRepo = getChatRepository();
      const conversation = await chatRepo.createConversation({
        doctor_id,
        patient_id,
        title,
        participant_type: 'doctor-patient',
        status: 'active',
        created_by: req.user?.id
      });

      // Create initial message
      const message = await chatRepo.createMessage({
        conversation_id: conversation.conversation_id,
        content: initial_message,
        sender_type: 'patient',
        sender_id: patient_id,
        message_type: 'text',
        status: 'sent'
      });

      return {
        conversation: {
          id: conversation.id,
          conversation_id: conversation.conversation_id,
          doctor_id: conversation.doctor_id,
          doctor_name: `${doctor.first_name} ${doctor.last_name}`,
          patient_id: conversation.patient_id,
          patient_name: patient ? `${patient.first_name} ${patient.last_name}` : null,
          title: conversation.title,
          participant_type: conversation.participant_type,
          status: conversation.status,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at
        },
        initial_message: {
          id: message.id,
          conversation_id: message.conversation_id,
          content: message.content,
          sender_type: message.sender_type,
          sender_id: message.sender_id,
          message_type: message.message_type,
          status: message.status,
          created_at: message.created_at
        }
      };

    } catch (error) {
      chat.error('Create doctor-patient conversation service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to create doctor-patient conversation', '5009');
    }
  }

  /**
   * Check if user is participant in conversation
   * @param {number} userId - User ID
   * @param {number} conversationId - Conversation ID
   * @param {string} userRole - User role
   * @returns {boolean} Is participant
   */
  static async isUserParticipant(userId, conversationId, userRole, profileId = null) {
    try {
      const userRepo = getUserRepository();
      
      // Debug: Check if conversation exists
      const conversation = await userRepo.findConversationById(conversationId);
      if (!conversation) {
        chat.error('Conversation not found:', { conversationId, userId, userRole });
        return false;
      }
      
      chat.debug('Checking user participant:', {
        userId,
        conversationId,
        userRole,
        profileId,
        conversation_patient_id: conversation.patient_id,
        conversation_doctor_id: conversation.doctor_id
      });
      
      const isParticipant = await userRepo.isUserParticipantByUserId(userId, conversationId, userRole, profileId);
      
      chat.debug('User participant result:', {
        userId,
        conversationId,
        userRole,
        profileId,
        isParticipant
      });
      
      return isParticipant;
    } catch (error) {
      chat.error('Check user participant error:', error);
      return false;
    }
  }

  /**
   * Delete conversation
   * @param {string|number} conversationId - Conversation ID
   * @param {number} userId - User ID
   * @returns {Object} Result
   */
  static async deleteConversation(conversationId, userId) {
    try {
      const userRepo = getUserRepository();

      // Validate conversation exists and user has permission
      const conversation = await userRepo.findConversationById(conversationId);
      if (!conversation) {
        throw new NotFoundError('Conversation not found', '4043');
      }

      // Check if user is authorized to delete this conversation
      // For now, allow participants to delete conversations
      const isParticipant = await ChatService.isUserParticipant(userId, conversationId, 'patient', null);
      if (!isParticipant) {
        throw new ForbiddenError('You are not authorized to delete this conversation', '4033');
      }

      // Soft delete by updating status to 'deleted'
      const updatedConversation = await userRepo.updateConversation(conversationId, {
        status: 'deleted'
      });

      chat.info(' Conversation deleted:', { 
        conversation_id: conversationId,
        deleted_by: userId
      });

      return {
        deleted: true,
        conversation_id: conversationId,
        message: 'Conversation deleted successfully'
      };

    } catch (error) {
      chat.error('Delete conversation service error:', error);
      if (error instanceof NotFoundError || error instanceof ForbiddenError) {
        throw error;
      }
      throw new InternalServerError('Failed to delete conversation', '5009');
    }
  }

  /**
   * Format conversation response
   * @param {Object} conversation - Raw conversation data
   * @returns {Object} Formatted conversation
   */
  static formatConversationResponse(conversation) {
    if (!conversation) return null;

    // Handle doctor name formatting
    let doctor_name = null;
    if (conversation.doctor_id && conversation.doctor_first_name && conversation.doctor_last_name) {
      doctor_name = `${conversation.doctor_first_name} ${conversation.doctor_last_name}`;
    } else if (conversation.doctor_name && conversation.doctor_name !== 'undefined undefined') {
      doctor_name = conversation.doctor_name;
    }

    // Handle patient name formatting
    let patient_name = null;
    if (conversation.patient_id && conversation.patient_first_name && conversation.patient_last_name) {
      patient_name = `${conversation.patient_first_name} ${conversation.patient_last_name}`;
    } else if (conversation.patient_name && conversation.patient_name !== 'undefined undefined') {
      patient_name = conversation.patient_name;
    }

    return {
      id: conversation.id,
      conversation_id: conversation.conversation_id,
      patient_id: conversation.patient_id,
      patient_name: patient_name,
      doctor_id: conversation.doctor_id,
      doctor_name: doctor_name,
      title: conversation.title,
      description: conversation.description,
      participant_type: conversation.participant_type,
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
      message_content: message.content,
      message_type: message.message_type,
      attachment_url: message.attachment_url,
      attachment_type: message.attachment_type,
      is_read: message.is_read,
      sent_at: message.sent_at,
      updated_at: message.updated_at
    };
  }
}

module.exports = ChatService; 