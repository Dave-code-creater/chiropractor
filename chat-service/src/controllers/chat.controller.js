const Conversation = require('../models/conversation.model.js');
const Message = require('../models/message.model.js');
const User = require('../models/user.model.js');
const { OK, CREATED, NotFoundError, ForbiddenError, InternalServerError } = require('../utils/httpResponses.js');

class ChatController {
  static async createConversation(req, res) {
    try {
      const me = req.user.sub;
      const { withUserId } = req.body;
      
      const other = await User.findById(withUserId);
      if (!other) {
        return new NotFoundError('User not found').send(res);
      }
      
      let convo = await Conversation.findOne({ 
        participants: { $all: [me, withUserId], $size: 2 } 
      });
      
      if (!convo) {
        convo = await Conversation.create({ participants: [me, withUserId] });
      }
      
      return new OK({ metadata: convo }).send(res);
    } catch (err) {
      console.error('Error creating conversation:', err);
      return new InternalServerError('Error creating conversation').send(res);
    }
  }

  static async getConversations(req, res) {
    try {
      const me = req.user.sub;
      const convos = await Conversation.find({ participants: me })
        .sort({ updatedAt: -1 })
        .populate('participants', 'name email role')
        .populate('lastMessage');
      
      return new OK({ metadata: convos }).send(res);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      return new InternalServerError('Error fetching conversations').send(res);
    }
  }

  static async getConversationMessages(req, res) {
    try {
      const me = req.user.sub;
      const cId = req.params.id;
      
      const convo = await Conversation.findOne({ _id: cId, participants: me });
      if (!convo) {
        return new ForbiddenError('Access denied to this conversation').send(res);
      }
      
      const messages = await Message.find({ conversation: cId })
        .sort({ timestamp: 1 })
        .populate('sender', 'name email role');
      
      return new OK({ metadata: messages }).send(res);
    } catch (err) {
      console.error('Error fetching messages:', err);
      return new InternalServerError('Error fetching messages').send(res);
    }
  }

  static async sendMessage(req, res) {
    try {
      const me = req.user.sub;
      const { conversationId, content, type = 'text' } = req.body;
      
      const convo = await Conversation.findOne({ 
        _id: conversationId, 
        participants: me 
      });
      
      if (!convo) {
        return new ForbiddenError('Access denied to this conversation').send(res);
      }
      
      const message = await Message.create({
        conversation: conversationId,
        sender: me,
        content,
        type,
        timestamp: new Date()
      });
      
      // Update conversation's lastMessage and updatedAt
      await Conversation.findByIdAndUpdate(conversationId, {
        lastMessage: message._id,
        updatedAt: new Date()
      });
      
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'name email role');
      
      return new CREATED({ metadata: populatedMessage }).send(res);
    } catch (err) {
      console.error('Error sending message:', err);
      return new InternalServerError('Error sending message').send(res);
    }
  }
}

module.exports = ChatController; 