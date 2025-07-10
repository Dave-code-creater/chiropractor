const express = require('express');
const ChatController = require('../controllers/chat.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Chat Routes with static controller methods
 * [Request] -> [Routing] -> [Controller] -> [Service] -> [Repository] -> [Database]
 */

// Protected routes (authentication required)
router.post('/conversations', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.createConversation)
);

router.get('/available-users', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.getAvailableUsers)
);

router.get('/staff-admin-doctors', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.getAllStaffAdminDoctors)
);

router.get('/conversations', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.getUserConversations)
);

router.get('/conversations/:id', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.getConversationById)
);

router.get('/conversations/:id/messages', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.getConversationMessages)
);

router.put('/conversations/:id/status', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff']), 
  asyncHandler(ChatController.updateConversationStatus)
);

router.post('/messages', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.sendMessage)
);

router.delete('/conversations/:conversationId', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.deleteConversation)
);

module.exports = router; 