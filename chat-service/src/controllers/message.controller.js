const Message = require('../models/message.model.js');
const Conversation = require('../models/conversation.model.js');
const UserService = require('../services/user.service.js');
const { OK, CREATED, NotFoundError, ForbiddenError, InternalServerError, BadRequestError } = require('../utils/httpResponses.js');

class MessageController {
  /**
   * Send a message to a conversation
   */
  static async sendMessage(req, res) {
    try {
      const currentUserId = req.user.sub;
      const { conversation_id, content, sender_type } = req.body;
      
      // Validate required fields
      if (!conversation_id || !content) {
        return new BadRequestError('conversation_id and content are required').send(res);
      }
      
      // Get current user's chat profile
      const currentUser = await UserService.getUserByUserId(currentUserId);
      if (!currentUser) {
        return new NotFoundError('User not found in chat service').send(res);
      }
      
      // Verify user has access to this conversation
      const conversation = await Conversation.findOne({ 
        _id: conversation_id, 
        participants: currentUser._id,
        isActive: true
      });
      
      if (!conversation) {
        return new ForbiddenError('Access denied to this conversation').send(res);
      }
      
      // Determine sender type based on user role if not provided
      let finalSenderType = sender_type || 'user';
      if (currentUser.role === 'doctor') {
        finalSenderType = 'doctor';
      } else if (currentUser.role === 'staff') {
        finalSenderType = 'staff';
      } else if (currentUser.role === 'admin') {
        finalSenderType = 'admin';
      }
      
      // Create the message
      const message = await Message.create({
        conversation: conversation_id,
        sender: currentUser._id,
        content: content.trim(),
        messageType: 'text',
        senderType: finalSenderType,
        timestamp: new Date(),
        readBy: [currentUser._id], // Mark as read by sender
        deliveredTo: [],
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }
      });
      
      // Update conversation's last message and timestamp
      await Conversation.findByIdAndUpdate(conversation_id, {
        lastMessage: message._id,
        updatedAt: new Date()
      });
      
      // Populate sender information for response
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'userId firstName lastName role profileImage');
      
      return new CREATED({ 
        metadata: populatedMessage,
        message: 'Message sent successfully'
      }).send(res);
    } catch (err) {
      console.error('Error sending message:', err);
      return new InternalServerError('Error sending message').send(res);
    }
  }
}

module.exports = MessageController; 