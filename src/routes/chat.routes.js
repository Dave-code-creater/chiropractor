const express = require('express');
const ChatController = require('../controllers/chat.controller');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * ===============================================
 * STANDARDIZED CHAT API ROUTES
 * ===============================================
 * 
 * RESTful structure with nested resources and consistent response format:
 * { 
 *   "success": true,
 *   "data": { … },
 *   "meta": { pagination, roles }, 
 *   "message": "OK"
 * }
 */

// ===============================================
// CONVERSATION ROUTES
// ===============================================

/**
 * Create a new conversation
 * POST /chat/conversations
 * Body: { target_user_id, subject, priority }
 * Auth: doctor, admin, staff, patient
 */
router.post('/conversations', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.createConversation)
);

/**
 * Get available users for creating conversations with role filtering
 * GET /chat/conversations/users?role=doctor&search_term=smith&per_page=50
 * Auth: doctor, admin, staff, patient
 */
router.get('/conversations/users', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.getConversationUsers)
);

/**
 * Get user's conversations
 * GET /chat/conversations?page=1&per_page=10&status=active
 * Auth: doctor, admin, staff, patient
 */
router.get('/conversations', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.getUserConversations)
);

/**
 * Get specific conversation
 * GET /chat/conversations/{conversationId}
 * Auth: doctor, admin, staff, patient
 */
router.get('/conversations/:id', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.getConversationById)
);

/**
 * Update conversation status
 * PUT /chat/conversations/{conversationId}/status
 * Body: { status: 'active' | 'archived' | 'closed' }
 * Auth: doctor, admin, staff
 */
router.put('/conversations/:id/status', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff']), 
  asyncHandler(ChatController.updateConversationStatus)
);

/**
 * Delete conversation
 * DELETE /chat/conversations/{conversationId}
 * Auth: doctor, admin, staff, patient
 */
router.delete('/conversations/:conversationId', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.deleteConversation)
);

// ===============================================
// LONG-POLLING CHAT MESSAGING (REAL-TIME)
// ===============================================

/**
 * Send message to a conversation (Long-Polling compatible)
 * POST /chat/conversations/{conversationId}/messages
 * Body: { content, message_type }
 * Auth: doctor, admin, staff, patient
 */
router.post('/conversations/:conversationId/messages', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.sendMessage)
);

/**
 * Long-polling endpoint to get new messages (replaces regular GET messages)
 * GET /chat/conversations/{conversationId}/poll?last_message_timestamp=2025-07-14T10:30:00Z&timeout_seconds=30&max_messages=50
 * Auth: doctor, admin, staff, patient
 */
router.get('/conversations/:conversationId/poll', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.pollForNewMessages)
);

/**
 * Get message status and delivery info
 * GET /chat/conversations/{conversationId}/messages/{messageId}/status
 * Auth: doctor, admin, staff, patient
 */
router.get('/conversations/:conversationId/messages/:messageId/status', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.getMessageStatus)
);

// ===============================================
// USER AND UTILITY ROUTES
// ===============================================

/**
 * Get available users for chat with role filtering
 * GET /chat/users?role=doctor&search_term=smith&per_page=50
 * Auth: doctor, admin, staff, patient
 */
router.get('/users', 
  authenticate, 
  authorize(['doctor', 'admin', 'staff', 'patient']), 
  asyncHandler(ChatController.getAvailableUsers)
);

module.exports = router; 