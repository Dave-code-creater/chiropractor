const {
  ConversationCreatedSuccess,
  MessageSentSuccess,
  SuccessResponse,
  ErrorResponse
} = require('../utils/httpResponses');
const { getPostgreSQLPool } = require('../config/database');
const { createConversationSchema, doctorPatientConversationSchema, sendMessageSchema } = require('../validators').schemas;
const ChatService = require('../services/chat.service');
const { api, error: logError, info, debug } = require('../utils/logger');

/**
 * Chat Controller
 * Static methods that handle HTTP concerns and delegate business logic to ChatService
 * 
 * Flow: [Routing] -> [Controller] -> [Service] -> [Repository] -> [Database]
 */
class ChatController {
  /**
   * Create a new conversation
   * POST /chat/conversations
   */
  static async createConversation(req, res) {
    try {
      api.info('🔄 ChatController.createConversation called:', {
        body: req.body,
        user_id: req.user?.id,
        user_role: req.user?.role
      });

      const conversation = await ChatService.createConversation(req.body, req);

      api.info('✅ ChatController.createConversation successful:', {
        conversation_id: conversation?.id
      });

      return new SuccessResponse(
        'Conversation created successfully',
        201,
        conversation
      ).send(res);
    } catch (error) {
      api.error('❌ ChatController.createConversation error:', {
        error_message: error.message,
        error_name: error.constructor.name,
        body: req.body,
        user_id: req.user?.id
      });
      throw error; // Re-throw to let asyncHandler catch it
    }
  }

  /**
   * Send a message to a conversation
   * POST /chat/conversations/{conversationId}/messages
   */
  static async sendMessage(req, res) {
    try {
      // Extract conversation_id from URL params instead of body
      const messageData = {
        ...req.body,
        conversation_id: req.params.conversationId
      };

      const message = await ChatService.sendMessage(messageData, req);

      return new SuccessResponse(
        'Message sent successfully',
        201,
        message
      ).send(res);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Long-polling endpoint to get new messages
   * GET /chat/conversations/{conversationId}/poll?last_message_timestamp=2025-07-14T10:30:00Z&timeout_seconds=30
   */
  static async pollForNewMessages(req, res) {
    try {
      const { conversationId } = req.params;
      const {
        last_message_timestamp,
        timeout_seconds = 30,
        max_messages = 50
      } = req.query;

      // Validate conversation access
      const hasAccess = await ChatService.validateConversationAccess(conversationId, req.user);
      if (!hasAccess) {
        throw new ErrorResponse('You are not authorized to access this conversation', 403, '4033');
      }

      // Start Long-Polling for new messages
      const result = await ChatService.pollForNewMessages({
        conversation_id: conversationId,
        last_message_timestamp,
        timeout_seconds: parseInt(timeout_seconds),
        max_messages: parseInt(max_messages),
        user: req.user
      });

      const meta = {
        conversation_id: conversationId,
        polling_timeout: parseInt(timeout_seconds),
        has_new_messages: result.messages.length > 0,
        last_poll_timestamp: new Date().toISOString(),
        next_poll_timestamp: result.next_poll_timestamp
      };

      return new SuccessResponse(
        result.messages.length > 0 ? 'New messages found' : 'No new messages',
        200,
        {
          messages: result.messages,
          conversation_status: result.conversation_status
        },
        meta
      ).send(res);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get message status and delivery info
   * GET /chat/conversations/{conversationId}/messages/{messageId}/status
   */
  static async getMessageStatus(req, res) {
    try {
      const { conversationId, messageId } = req.params;

      const messageStatus = await ChatService.getMessageStatus(messageId, conversationId, req.user);

      const meta = {
        conversation_id: conversationId,
        message_id: messageId,
        checked_at: new Date().toISOString()
      };

      return new SuccessResponse(
        'Message status retrieved successfully',
        200,
        messageStatus,
        meta
      ).send(res);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Get conversation by ID
   * GET /chat/conversations/{conversationId}
   */
  static async getConversationById(req, res) {
    const conversation = await ChatService.getConversationById(req.params.id, req.user);
    return new SuccessResponse('Conversation retrieved successfully', 200, conversation).send(res);
  }

  /**
   * Get user conversations
   * GET /chat/conversations
   */
  static async getUserConversations(req, res) {
    const conversations = await ChatService.getUserConversations(req.user, req.query);

    // Extract pagination info for meta using snake_case
    const { page = 1, per_page = 10 } = req.query;
    const meta = {
      pagination: {
        current_page: parseInt(page),
        per_page: parseInt(per_page),
        total_count: conversations.length
      }
    };

    return new SuccessResponse(
      'Conversations retrieved successfully',
      200,
      conversations,
      meta
    ).send(res);
  }

  /**
   * Update conversation status
   * PUT /chat/conversations/{conversationId}/status
   */
  static async updateConversationStatus(req, res) {
    const conversation = await ChatService.updateConversationStatus(req.params.id, req.body.status, req.user);
    return new SuccessResponse('Conversation status updated successfully', 200, conversation).send(res);
  }

  /**
   * Get available users for chat based on role restrictions with role filtering
   * GET /chat/users?role=doctor (or /chat/available-users for legacy)
   */
  static async getAvailableUsers(req, res) {
    try {
      const { role } = req.query;

      // If role is specified, filter by that role (replaces the old staff-admin-doctors endpoint)
      if (role) {
        // Validate role parameter
        const validRoles = ['doctor', 'staff', 'admin'];
        if (!validRoles.includes(role)) {
          throw new ErrorResponse('Invalid role parameter. Must be one of: doctor, staff, admin', 400, '4001');
        }

        const users = await ChatService.getUsersByRole(role, req.query);

        const meta = {
          roles: [role],
          total_count: users.length
        };

        return new SuccessResponse(
          `${role.charAt(0).toUpperCase() + role.slice(1)}s retrieved successfully`,
          200,
          users,
          meta
        ).send(res);
      }

      // Default behavior - get all available users
      const users = await ChatService.getAvailableUsersForChat(req.user, req.query);
      return new SuccessResponse('Available users retrieved successfully', 200, users).send(res);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get users for creating conversations with role filtering
   * GET /chat/conversations/users?role=doctor&search_term=smith&per_page=50
   */
  static async getConversationUsers(req, res) {
    try {
      const { role } = req.query;

      // Validate role parameter is provided
      if (!role) {
        throw new ErrorResponse('Role parameter is required. Must be one of: doctor, staff, admin', 400, '4001');
      }

      // Validate role parameter value
      const validRoles = ['doctor', 'staff', 'admin'];
      if (!validRoles.includes(role)) {
        throw new ErrorResponse('Invalid role parameter. Must be one of: doctor, staff, admin', 400, '4001');
      }

      // Get users by role for conversation creation
      const users = await ChatService.getUsersForConversations(role, req.query, req.user);

      // Extract pagination info using snake_case
      const { per_page = 100, search_term = '' } = req.query;
      const meta = {
        role_filter: role,
        total_count: users.length,
        per_page: parseInt(per_page),
        search_applied: !!search_term,
        context: 'conversation_creation'
      };

      const roleDisplayName = role === 'doctor' ? 'doctors' :
        role === 'staff' ? 'staff members' : 'administrators';

      return new SuccessResponse(
        `Available ${roleDisplayName} for conversations retrieved successfully`,
        200,
        users,
        meta
      ).send(res);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all staff, admin, and doctors for chat selection (DEPRECATED - use /users?role=X instead)
   * GET /chat/staff-admin-doctors
   */
  static async getAllAdminDoctors(req, res) {
    const result = await ChatService.getAllAdminDoctors(req.query);
    return new SuccessResponse('Staff, admin, and doctors retrieved successfully', 200, result).send(res);
  }



  static async createDoctorPatientConversation(req, res) {
    try {
      api.info('Creating doctor-patient conversation:', { doctor_id: req.body?.doctor_id });

      // Validate request body
      const { error, value } = doctorPatientConversationSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      // Delegate to service layer
      const result = await ChatService.createDoctorPatientConversation(value, req);

      api.info('Doctor-patient conversation created successfully:', {
        conversation_id: result.conversation.conversation_id
      });

      return new SuccessResponse('Doctor-patient conversation created successfully', 201, result).send(res);

    } catch (error) {
      api.error('Doctor-patient conversation creation error:', error);
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      return new ErrorResponse('Internal server error during doctor-patient conversation creation', 500, '5000').send(res);
    }
  }

  /**
   * Delete conversation
   * DELETE /chat/conversations/{conversationId}
   */
  static async deleteConversation(req, res) {
    try {
      const { conversationId } = req.params;
      const userId = req.user.id;

      const result = await ChatService.deleteConversation(conversationId, userId);

      const response = new SuccessResponse('Conversation deleted successfully', 200, result);
      response.send(res);

    } catch (error) {
      api.error('Delete conversation error:', error);
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error while deleting conversation', 500, '5000');
        errorResponse.send(res);
      }
    }
  }
}

module.exports = ChatController; 