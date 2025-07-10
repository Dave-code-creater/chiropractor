const { 
  ConversationCreatedSuccess, 
  MessageSentSuccess, 
  SuccessResponse, 
  ErrorResponse 
} = require('../utils/httpResponses');
const { getPostgreSQLPool } = require('../config/database');
const { createConversationSchema, doctorPatientConversationSchema, sendMessageSchema } = require('../validators').schemas;
const ChatService = require('../services/ChatService');
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
   * POST /api/chats/conversations
   */
  static async createConversation(req, res) {
    try {
      api.info('🔄 ChatController.createConversation called:', {
        body: req.body,
        user_id: req.user?.id,
        user_role: req.user?.role
      });
      
      const conversation = await ChatService.createConversation(req.body, req);
      
      api.info(' ChatController.createConversation successful:', {
        conversation_id: conversation?.id
      });
      
      return new ConversationCreatedSuccess({ metadata: conversation }).send(res);
    } catch (error) {
      api.error(' ChatController.createConversation error:', {
        error_message: error.message,
        error_name: error.constructor.name,
        body: req.body,
        user_id: req.user?.id
      });
      throw error; // Re-throw to let asyncHandler catch it
    }
  }

  /**
   * Send a message
   * POST /api/chats/messages
   */
  static async sendMessage(req, res) {
    const message = await ChatService.sendMessage(req.body, req);
    return new MessageSentSuccess({ metadata: message }).send(res);
  }

  /**
   * Get conversation by ID
   * GET /api/chats/conversations/:id
   */
  static async getConversationById(req, res) {
    const conversation = await ChatService.getConversationById(req.params.id, req.user);
    return new SuccessResponse('Conversation retrieved successfully', 200, conversation).send(res);
  }

  /**
   * Get messages for a conversation
   * GET /api/chats/conversations/:id/messages
   */
  static async getConversationMessages(req, res) {
    const messages = await ChatService.getConversationMessages(req.params.id, req.query, req.user);
    return new SuccessResponse('Messages retrieved successfully', 200, messages).send(res);
  }

  /**
   * Get user conversations
   * GET /api/chats/conversations
   */
  static async getUserConversations(req, res) {
    const conversations = await ChatService.getUserConversations(req.user, req.query);
    return new SuccessResponse('Conversations retrieved successfully', 200, conversations).send(res);
  }

  /**
   * Update conversation status
   * PUT /api/chats/conversations/:id/status
   */
  static async updateConversationStatus(req, res) {
    const conversation = await ChatService.updateConversationStatus(req.params.id, req.body.status, req.user);
    return new SuccessResponse('Conversation status updated successfully', 200, conversation).send(res);
  }

  /**
   * Get available users for chat based on role restrictions
   * GET /api/chats/available-users
   */
  static async getAvailableUsers(req, res) {
    const users = await ChatService.getAvailableUsersForChat(req.user, req.query);
    return new SuccessResponse('Available users retrieved successfully', 200, users).send(res);
  }

  /**
   * Get all staff, admin, and doctors for chat selection
   * GET /api/chats/staff-admin-doctors
   */
  static async getAllStaffAdminDoctors(req, res) {
    const result = await ChatService.getAllStaffAdminDoctors(req.query);
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

  static async getConversations(req, res) {
    try {
      // Delegate to service layer
      const conversations = await ChatService.getConversations(req.query, req.user);

      return new SuccessResponse('Conversations retrieved successfully', 200, {
        conversations,
        total_count: conversations.length
      }).send(res);

    } catch (error) {
      api.error('Get conversations error:', error);
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      return new ErrorResponse('Internal server error while retrieving conversations', 500, '5000').send(res);
    }
  }

  static async getMessages(req, res) {
    try {
      const { conversation_id } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      if (!conversation_id) {
        throw new ErrorResponse('Conversation ID is required', 400, '4001');
      }

      // Delegate to service layer
      const messages = await ChatService.getConversationMessages(conversation_id, { limit, offset }, req.user);

      return new SuccessResponse('Messages retrieved successfully', 200, {
        messages,
        conversation_id,
        total_count: messages.length,
        limit: parseInt(limit),
        offset: parseInt(offset)
      }).send(res);

    } catch (error) {
      api.error('Get messages error:', error);
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      return new ErrorResponse('Internal server error while retrieving messages', 500, '5000').send(res);
    }
  }

  /**
   * Delete conversation
   * DELETE /api/chats/conversations/:conversationId
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