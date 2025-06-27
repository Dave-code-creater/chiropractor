const Conversation = require('../models/conversation.model.js');
const Message = require('../models/message.model.js');
const UserService = require('../services/user.service.js');
const { OK, CREATED, NotFoundError, ForbiddenError, InternalServerError, BadRequestError } = require('../utils/httpResponses.js');

class ConversationController {
  /**
   * Create a new conversation based on participant type
   */
  static async createConversation(req, res) {
    try {
      const currentUserId = req.user.sub;
      const { title, description, participant_type } = req.body;
      
      // Validate required fields
      if (!title || !participant_type) {
        return new BadRequestError('title and participant_type are required').send(res);
      }
      
      // Get current user's chat profile
      const currentUser = await UserService.getUserByUserId(currentUserId);
      if (!currentUser) {
        return new NotFoundError('Current user not found in chat service').send(res);
      }
      
      // Find available participants based on type
      let availableParticipants = [];
      if (participant_type === 'doctor') {
        availableParticipants = await UserService.getAllDoctors();
      } else if (participant_type === 'staff') {
        availableParticipants = await UserService.getAllStaff();
      } else if (participant_type === 'admin') {
        // For now, treat admin same as staff
        availableParticipants = await UserService.getAllStaff();
      }
      
      if (availableParticipants.length === 0) {
        return new NotFoundError(`No ${participant_type} available for conversation`).send(res);
      }
      
      // For now, create conversation with first available participant
      // In a real system, you might want to implement smart assignment
      const targetParticipant = availableParticipants[0];
      const targetUser = await UserService.getUserByUserId(targetParticipant.userId);
      
      // Check if conversation already exists
      let conversation = await Conversation.findOne({
        participants: { $all: [currentUser._id, targetUser._id], $size: 2 },
        type: 'direct'
      });
      
      if (!conversation) {
        // Create new conversation
        conversation = await Conversation.create({
          participants: [currentUser._id, targetUser._id],
          type: 'direct',
          title: title,
          metadata: {
            description: description,
            participantType: participant_type,
            priority: 'normal'
          }
        });
      }
      
      // Populate participants for response
      const populatedConversation = await Conversation.findById(conversation._id)
        .populate('participants', 'userId firstName lastName role profileImage isOnline')
        .populate('lastMessage');
      
      return new CREATED({ 
        metadata: populatedConversation,
        message: 'Conversation created successfully'
      }).send(res);
    } catch (err) {
      console.error('Error creating conversation:', err);
      return new InternalServerError('Error creating conversation').send(res);
    }
  }

  /**
   * Get user's conversations with pagination and search
   * - Patients: only see their own conversations
   * - Doctors & Staff: can see all conversations
   */
  static async getConversations(req, res) {
    try {
      const currentUserId = req.user.sub; // User ID from JWT
      const userRole = req.user.role;     // User role from JWT
      const userEmail = req.user.email;   // User email from JWT
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const search = req.query.search || '';
      const skip = (page - 1) * limit;
      
      console.log(`🔍 Getting conversations for user ${currentUserId} (${userRole}) - ${userEmail}`);
      
      // Auto-register user in chat service if they don't exist
      let currentUser = await UserService.getUserByUserId(currentUserId);
      if (!currentUser) {
        console.log(`👤 Auto-registering user ${currentUserId} in chat service`);
        try {
          currentUser = await UserService.autoRegisterUser({
            userId: currentUserId,
            email: userEmail,
            role: userRole,
            firstName: userEmail.split('@')[0], // Use email prefix as first name
            lastName: 'User'
          });
        } catch (autoRegError) {
          console.error('Failed to auto-register user:', autoRegError);
          return new InternalServerError('Failed to initialize chat user').send(res);
        }
      }
      
      // Build search query based on user role
      let query = {
        isActive: true
      };
      
      // Role-based access control
      if (userRole === 'doctor' || userRole === 'staff') {
        // Doctors and Staff can see all conversations
        console.log(`🏥 ${userRole} access: showing all conversations`);
      } else {
        // Patients can only see their own conversations
        console.log(`👤 Patient access: showing only own conversations`);
        query.participants = currentUser._id;
      }
      
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { 'metadata.description': { $regex: search, $options: 'i' } }
        ];
      }
      
      console.log('🔍 Query:', JSON.stringify(query, null, 2));
      
      // Get conversations with pagination
      const conversations = await Conversation.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('participants', 'userId firstName lastName role profileImage isOnline')
        .populate('lastMessage');
      
      // Get total count for pagination
      const total = await Conversation.countDocuments(query);
      
      console.log(`📊 Found ${conversations.length} conversations (total: ${total})`);
      
      const response = {
        conversations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        user: {
          id: currentUserId,
          email: userEmail,
          role: userRole
        },
        accessLevel: (userRole === 'doctor' || userRole === 'staff') ? 'all' : 'own'
      };
      
      return new OK({ metadata: response }).send(res);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      return new InternalServerError('Error fetching conversations').send(res);
    }
  }

  /**
   * Get all conversations (Doctor-only endpoint)
   * This endpoint is specifically for doctors to view all conversations in the system
   */
  static async getAllConversations(req, res) {
    try {
      const currentUserId = req.user.sub;
      const userRole = req.user.role;
      
      // Only doctors can access this endpoint
      if (userRole !== 'doctor') {
        return new ForbiddenError('Access denied. Only doctors can view all conversations.').send(res);
      }
      
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const search = req.query.search || '';
      const filterByRole = req.query.filterByRole || ''; // patient, staff, doctor
      const filterByStatus = req.query.filterByStatus || 'active'; // active, inactive, all
      const skip = (page - 1) * limit;
      
      // Build query for all conversations
      let query = {};
      
      // Status filter
      if (filterByStatus === 'active') {
        query.isActive = true;
      } else if (filterByStatus === 'inactive') {
        query.isActive = false;
      }
      // 'all' means no status filter
      
      // Search filter
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { 'metadata.description': { $regex: search, $options: 'i' } }
        ];
      }
      
      // Get conversations with population
      let conversationsQuery = Conversation.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('participants', 'userId firstName lastName role profileImage isOnline')
        .populate('lastMessage');
      
      const conversations = await conversationsQuery;
      
      // Filter by participant role if specified
      let filteredConversations = conversations;
      if (filterByRole) {
        filteredConversations = conversations.filter(conv => 
          conv.participants.some(participant => participant.role === filterByRole)
        );
      }
      
      // Get total count
      const total = await Conversation.countDocuments(query);
      
      const response = {
        conversations: filteredConversations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        },
        filters: {
          search,
          filterByRole,
          filterByStatus
        },
        accessLevel: 'all',
        userRole: 'doctor'
      };
      
      return new OK({ metadata: response }).send(res);
    } catch (err) {
      console.error('Error fetching all conversations:', err);
      return new InternalServerError('Error fetching all conversations').send(res);
    }
  }

  /**
   * Search conversations (role-based access)
   * - Regular users: search only their own conversations
   * - Doctors: search all conversations
   */
  static async searchConversations(req, res) {
    try {
      const currentUserId = req.user.sub;
      const userRole = req.user.role;
      const { q } = req.query;
      
      if (!q || q.trim().length < 2) {
        return new BadRequestError('Search query must be at least 2 characters').send(res);
      }
      
      // Get current user's chat profile
      const currentUser = await UserService.getUserByUserId(currentUserId);
      if (!currentUser) {
        return new NotFoundError('User not found in chat service').send(res);
      }
      
      const searchRegex = new RegExp(q.trim(), 'i');
      
      // Build search query based on user role
      let query = {
        isActive: true,
        $or: [
          { title: searchRegex },
          { 'metadata.description': searchRegex }
        ]
      };
      
      // Role-based access control
      if (userRole !== 'doctor') {
        // Regular users can only search their own conversations
        query.participants = currentUser._id;
      }
      // Doctors can search all conversations (no additional restriction)
      
      const conversations = await Conversation.find(query)
        .sort({ updatedAt: -1 })
        .limit(20) // Limit search results
        .populate('participants', 'userId firstName lastName role profileImage isOnline')
        .populate('lastMessage');
      
      return new OK({ 
        metadata: {
          conversations,
          searchQuery: q,
          userRole: userRole,
          accessLevel: userRole === 'doctor' ? 'all' : 'own'
        }
      }).send(res);
    } catch (err) {
      console.error('Error searching conversations:', err);
      return new InternalServerError('Error searching conversations').send(res);
    }
  }

  /**
   * Get messages for a specific conversation with pagination
   * - Regular users: can only access conversations they're participants in
   * - Doctors: can access any conversation
   */
  static async getMessages(req, res) {
    try {
      const currentUserId = req.user.sub;
      const userRole = req.user.role;
      const { conversationId } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const skip = (page - 1) * limit;
      
      // Get current user's chat profile
      const currentUser = await UserService.getUserByUserId(currentUserId);
      if (!currentUser) {
        return new NotFoundError('User not found in chat service').send(res);
      }
      
      // Role-based access control for conversation access
      let conversation;
      if (userRole === 'doctor') {
        // Doctors can access any conversation
        conversation = await Conversation.findById(conversationId);
      } else {
        // Regular users can only access conversations they're participants in
        conversation = await Conversation.findOne({ 
          _id: conversationId, 
          participants: currentUser._id 
        });
      }
      
      if (!conversation) {
        return new ForbiddenError('Access denied to this conversation').send(res);
      }
      
      // Get messages with pagination
      const messages = await Message.find({ conversation: conversationId })
        .sort({ timestamp: -1 }) // Most recent first
        .skip(skip)
        .limit(limit)
        .populate('sender', 'userId firstName lastName role profileImage');
      
      // Get total count for pagination
      const total = await Message.countDocuments({ conversation: conversationId });
      
      const response = {
        messages: messages.reverse(), // Reverse to show oldest first in the array
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
      
      return new OK({ metadata: response }).send(res);
    } catch (err) {
      console.error('Error fetching messages:', err);
      return new InternalServerError('Error fetching messages').send(res);
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(req, res) {
    try {
      const currentUserId = req.user.sub;
      const { conversationId } = req.params;
      const { message_ids } = req.body;
      
      // Get current user's chat profile
      const currentUser = await UserService.getUserByUserId(currentUserId);
      if (!currentUser) {
        return new NotFoundError('User not found in chat service').send(res);
      }
      
      // Verify user has access to this conversation
      const conversation = await Conversation.findOne({ 
        _id: conversationId, 
        participants: currentUser._id 
      });
      
      if (!conversation) {
        return new ForbiddenError('Access denied to this conversation').send(res);
      }
      
      // Mark messages as read
      await Message.updateMany(
        { 
          _id: { $in: message_ids },
          conversation: conversationId
        },
        { 
          $addToSet: { readBy: currentUser._id },
          readAt: new Date()
        }
      );
      
      return new OK({ 
        message: 'Messages marked as read',
        metadata: { markedCount: message_ids.length }
      }).send(res);
    } catch (err) {
      console.error('Error marking messages as read:', err);
      return new InternalServerError('Error marking messages as read').send(res);
    }
  }

  /**
   * Create a direct chat between doctor and patient
   * This endpoint allows patients to start a chat with a specific doctor
   * or doctors to start a chat with a specific patient
   */
  static async createDoctorPatientChat(req, res) {
    try {
      const currentUserId = req.user.sub;
      const userRole = req.user.role;
      const userEmail = req.user.email;
      const { doctorId, patientId, title, initialMessage } = req.body;
      
      console.log(`🩺 Creating doctor-patient chat initiated by ${userRole} (${currentUserId})`);
      
      // Auto-register current user if needed
      let currentUser = await UserService.getUserByUserId(currentUserId);
      if (!currentUser) {
        currentUser = await UserService.autoRegisterUser({
          userId: currentUserId,
          email: userEmail,
          role: userRole,
          firstName: userEmail.split('@')[0],
          lastName: 'User'
        });
      }
      
      let doctorUser, patientUser;
      
      // Determine doctor and patient based on who's initiating
      if (userRole === 'patient') {
        // Patient is initiating chat with a doctor
        if (!doctorId) {
          return new BadRequestError('doctorId is required when patient initiates chat').send(res);
        }
        
        patientUser = currentUser;
        doctorUser = await UserService.getUserByUserId(doctorId);
        
        // If doctor doesn't exist in chat service, auto-register them
        if (!doctorUser) {
          console.log(`👨‍⚕️ Auto-registering doctor ${doctorId} in chat service`);
          try {
            // Create a basic doctor profile - the appointment service should have the real data
            doctorUser = await UserService.autoRegisterUser({
              userId: doctorId,
              email: `doctor${doctorId}@clinic.com`, // Placeholder email
              role: 'doctor',
              firstName: 'Dr.',
              lastName: `Doctor ${doctorId}`,
              specialization: 'General Medicine'
            });
          } catch (autoRegError) {
            console.error('Failed to auto-register doctor:', autoRegError);
            return new InternalServerError('Failed to initialize doctor in chat service').send(res);
          }
        }
        
        if (doctorUser.role !== 'doctor') {
          return new NotFoundError('Invalid doctor ID - user is not a doctor').send(res);
        }
      } else if (userRole === 'doctor') {
        // Doctor is initiating chat with a patient
        if (!patientId) {
          return new BadRequestError('patientId is required when doctor initiates chat').send(res);
        }
        
        doctorUser = currentUser;
        patientUser = await UserService.getUserByUserId(patientId);
        
        // If patient doesn't exist in chat service, auto-register them
        if (!patientUser) {
          console.log(`👤 Auto-registering patient ${patientId} in chat service`);
          try {
            patientUser = await UserService.autoRegisterUser({
              userId: patientId,
              email: `patient${patientId}@email.com`, // Placeholder email
              role: 'patient',
              firstName: 'Patient',
              lastName: `${patientId}`
            });
          } catch (autoRegError) {
            console.error('Failed to auto-register patient:', autoRegError);
            return new InternalServerError('Failed to initialize patient in chat service').send(res);
          }
        }
        
        if (patientUser.role !== 'patient') {
          return new NotFoundError('Invalid patient ID - user is not a patient').send(res);
        }
      } else {
        return new ForbiddenError('Only doctors and patients can create doctor-patient chats').send(res);
      }
      
      // Check if conversation already exists between these two users
      const existingConversation = await Conversation.findOne({
        participants: { $all: [doctorUser._id, patientUser._id], $size: 2 },
        type: 'direct',
        isActive: true
      });
      
      if (existingConversation) {
        console.log(`📱 Existing conversation found: ${existingConversation._id}`);
        
        // Populate and return existing conversation
        const populatedConversation = await Conversation.findById(existingConversation._id)
          .populate('participants', 'userId firstName lastName role profileImage isOnline')
          .populate('lastMessage');
        
        return new OK({
          metadata: {
            conversation: populatedConversation,
            isNew: false,
            message: 'Existing conversation found'
          }
        }).send(res);
      }
      
      // Create new conversation
      const conversationTitle = title || `Consultation: ${doctorUser.firstName} ${doctorUser.lastName} & ${patientUser.firstName} ${patientUser.lastName}`;
      
      const newConversation = await Conversation.create({
        participants: [doctorUser._id, patientUser._id],
        type: 'direct',
        title: conversationTitle,
        metadata: {
          description: 'Doctor-Patient consultation chat',
          participantType: 'doctor',
          doctorId: doctorUser.userId,
          patientId: patientUser.userId,
          priority: 'normal'
        }
      });
      
      console.log(`✅ New doctor-patient conversation created: ${newConversation._id}`);
      
      // Add initial message if provided
      if (initialMessage && initialMessage.trim()) {
        const Message = require('../models/message.model.js');
        
        const firstMessage = await Message.create({
          conversation: newConversation._id,
          sender: currentUser._id,
          content: initialMessage.trim(),
          messageType: 'text',
          senderType: userRole === 'doctor' ? 'doctor' : 'user',
          timestamp: new Date(),
          readBy: [currentUser._id]
        });
        
        // Update conversation with last message
        await Conversation.findByIdAndUpdate(newConversation._id, {
          lastMessage: firstMessage._id
        });
        
        console.log(`💬 Initial message added to conversation`);
      }
      
      // Populate and return the new conversation
      const populatedConversation = await Conversation.findById(newConversation._id)
        .populate('participants', 'userId firstName lastName role profileImage isOnline')
        .populate('lastMessage');
      
      return new CREATED({
        metadata: {
          conversation: populatedConversation,
          isNew: true,
          message: 'Doctor-patient chat created successfully'
        }
      }).send(res);
      
    } catch (err) {
      console.error('Error creating doctor-patient chat:', err);
      return new InternalServerError('Error creating doctor-patient chat').send(res);
    }
  }

  /**
   * Delete conversation
   */
  static async deleteConversation(req, res) {
    try {
      const currentUserId = req.user.sub;
      const { conversationId } = req.params;
      
      // Get current user's chat profile
      const currentUser = await UserService.getUserByUserId(currentUserId);
      if (!currentUser) {
        return new NotFoundError('User not found in chat service').send(res);
      }
      
      // Verify user has access to this conversation
      const conversation = await Conversation.findOne({ 
        _id: conversationId, 
        participants: currentUser._id 
      });
      
      if (!conversation) {
        return new ForbiddenError('Access denied to this conversation').send(res);
      }
      
      // Soft delete - mark as inactive instead of actual deletion
      await Conversation.findByIdAndUpdate(conversationId, { 
        isActive: false,
        deletedAt: new Date(),
        deletedBy: currentUser._id
      });
      
      return new OK({ 
        message: 'Conversation deleted successfully'
      }).send(res);
    } catch (err) {
      console.error('Error deleting conversation:', err);
      return new InternalServerError('Error deleting conversation').send(res);
    }
  }
}

module.exports = ConversationController; 