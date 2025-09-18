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

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Secure messaging endpoints for patients, doctors, and staff
 */

/**
 * @swagger
 * /chat/conversations:
 *   post:
 *     summary: Create a new conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatConversationRequest'
 *     responses:
 *       201:
 *         description: Conversation created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error or duplicate conversation
 */
router.post('/conversations', 
  authenticate, 
  authorize(['doctor', 'admin', 'patient']), 
  asyncHandler(ChatController.createConversation)
);

/**
 * @swagger
 * /chat/conversations/users:
 *   get:
 *     summary: Get available users to start a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [doctor, staff, admin]
 *         description: Filter by user role
 *       - in: query
 *         name: search_term
 *         schema:
 *           type: string
 *         description: Partial name or email to search
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 25
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/conversations/users', 
  authenticate, 
  authorize(['doctor', 'admin', 'patient']), 
  asyncHandler(ChatController.getConversationUsers)
);

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     summary: List conversations for the authenticated user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, archived, closed]
 *       - in: query
 *         name: participant_role
 *         schema:
 *           type: string
 *           enum: [doctor, patient, admin, staff]
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/conversations', 
  authenticate, 
  authorize(['doctor', 'admin', 'patient']), 
  asyncHandler(ChatController.getUserConversations)
);

/**
 * @swagger
 * /chat/conversations/{id}:
 *   get:
 *     summary: Get conversation by ID
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Conversation not found
 */
router.get('/conversations/:id', 
  authenticate, 
  authorize(['doctor', 'admin', 'patient']), 
  asyncHandler(ChatController.getConversationById)
);

/**
 * @swagger
 * /chat/conversations/{id}/status:
 *   put:
 *     summary: Update conversation status
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ConversationStatusRequest'
 *     responses:
 *       200:
 *         description: Conversation status updated successfully
 *       400:
 *         description: Invalid status transition
 */
router.put('/conversations/:id/status', 
  authenticate, 
  authorize(['doctor', 'admin']), 
  asyncHandler(ChatController.updateConversationStatus)
);

/**
 * @swagger
 * /chat/conversations/{conversationId}:
 *   delete:
 *     summary: Delete a conversation thread
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 *       404:
 *         description: Conversation not found
 */
router.delete('/conversations/:conversationId', 
  authenticate, 
  authorize(['doctor', 'admin', 'patient']), 
  asyncHandler(ChatController.deleteConversation)
);


/**
 * @swagger
 * /chat/conversations/{conversationId}/messages:
 *   post:
 *     summary: Send a message in a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatMessageRequest'
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Validation error
 */
router.post('/conversations/:conversationId/messages', 
  authenticate, 
  authorize(['doctor', 'admin', 'patient']), 
  asyncHandler(ChatController.sendMessage)
);

/**
 * @swagger
 * /chat/conversations/{conversationId}/poll:
 *   get:
 *     summary: Long-polling endpoint for new messages
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: last_message_timestamp
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Timestamp of the latest message already received
 *       - in: query
 *         name: timeout_seconds
 *         schema:
 *           type: integer
 *           default: 30
 *           maximum: 60
 *       - in: query
 *         name: max_messages
 *         schema:
 *           type: integer
 *           default: 50
 *     responses:
 *       200:
 *         description: Poll completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/conversations/:conversationId/poll', 
  authenticate, 
  authorize(['doctor', 'admin', 'patient']), 
  asyncHandler(ChatController.pollForNewMessages)
);

/**
 * @swagger
 * /chat/conversations/{conversationId}/messages/{messageId}/status:
 *   get:
 *     summary: Get message delivery status
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Message status retrieved
 *       404:
 *         description: Message not found
 */
router.get('/conversations/:conversationId/messages/:messageId/status', 
  authenticate, 
  authorize(['doctor', 'admin', 'patient']), 
  asyncHandler(ChatController.getMessageStatus)
);


/**
 * @swagger
 * /chat/users:
 *   get:
 *     summary: List users available for chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [doctor, staff, admin]
 *       - in: query
 *         name: search_term
 *         schema:
 *           type: string
 *       - in: query
 *         name: per_page
 *         schema:
 *           type: integer
 *           default: 25
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 */
router.get('/users', 
  authenticate, 
  authorize(['doctor', 'admin', 'patient']), 
  asyncHandler(ChatController.getAvailableUsers)
);

module.exports = router; 
