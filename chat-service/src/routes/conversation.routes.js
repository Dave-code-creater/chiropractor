const { Router } = require('express');
const { rbac } = require('../middlewares/rbac.middleware.js');
const ConversationController = require('../controllers/conversation.controller.js');

const router = Router();

// Simple JWT middleware inline to avoid import issues
const jwtAuth = (req, res, next) => {
  try {
    const jwt = require('jsonwebtoken');
    const authHeader = req.headers.authorization;
    
    console.log('🔍 JWT Debug - Auth header:', authHeader ? 'Present' : 'Missing');
    console.log('🔍 JWT Debug - JWT_SECRET exists:', !!process.env.JWT_SECRET);
    
    if (!authHeader) {
      console.log('❌ No authorization header');
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Invalid authorization format');
      return res.status(401).json({ error: 'Invalid authorization format' });
    }
    
    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ error: 'No token provided' });
    }
    
    console.log('🔍 JWT Debug - Token length:', token.length);
    
    // Try to verify token using JWT_SECRET (not PUBLIC_KEY)
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ JWT Debug - Token verified, payload:', payload);
    
    req.user = payload;
    next();
  } catch (err) {
    console.log('❌ JWT Debug - Verification error:', err.message);
    res.status(401).json({ error: 'Invalid token', details: err.message });
  }
};

router.use(jwtAuth);

/**
 * @swagger
 * /conversations:
 *   post:
 *     summary: Create a new conversation
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               participant_type:
 *                 type: string
 *                 enum: [doctor, staff, admin]
 *     responses:
 *       201:
 *         description: Conversation created successfully
 */
router.post('/', rbac('patient', 'staff', 'doctor'), ConversationController.createConversation);

/**
 * @swagger
 * /conversations/doctor-patient:
 *   post:
 *     summary: Create a direct chat between doctor and patient
 *     description: Creates or returns existing chat between a specific doctor and patient
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctorId:
 *                 type: integer
 *                 description: Required when patient initiates chat
 *               patientId:
 *                 type: integer
 *                 description: Required when doctor initiates chat
 *               title:
 *                 type: string
 *                 description: Optional custom title for the conversation
 *               initialMessage:
 *                 type: string
 *                 description: Optional first message to send
 *     responses:
 *       200:
 *         description: Existing conversation found
 *       201:
 *         description: New doctor-patient chat created
 *       400:
 *         description: Missing required parameters
 *       403:
 *         description: Only doctors and patients can create these chats
 *       404:
 *         description: Doctor or patient not found
 */
router.post('/doctor-patient', rbac('patient', 'doctor'), ConversationController.createDoctorPatientChat);

/**
 * @swagger
 * /conversations:
 *   get:
 *     summary: Get user's conversations (role-based access)
 *     description: Regular users see only their conversations, doctors see all conversations
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/', rbac('patient', 'staff', 'doctor'), ConversationController.getConversations);

/**
 * @swagger
 * /conversations/all:
 *   get:
 *     summary: Get all conversations (Doctor-only)
 *     description: Only doctors can access this endpoint to view all conversations in the system
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: filterByRole
 *         schema:
 *           type: string
 *           enum: [patient, staff, doctor]
 *       - in: query
 *         name: filterByStatus
 *         schema:
 *           type: string
 *           enum: [active, inactive, all]
 *           default: active
 *     responses:
 *       200:
 *         description: List of all conversations
 *       403:
 *         description: Access denied (non-doctors)
 */
router.get('/all', rbac('doctor'), ConversationController.getAllConversations);

/**
 * @swagger
 * /conversations/search:
 *   get:
 *     summary: Search conversations
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/search', rbac('patient', 'staff', 'doctor'), ConversationController.searchConversations);

/**
 * @swagger
 * /conversations/{conversationId}/messages:
 *   get:
 *     summary: Get messages for a specific conversation (role-based access)
 *     description: Regular users can only access their own conversations, doctors can access any conversation
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *     responses:
 *       200:
 *         description: List of messages
 *       403:
 *         description: Access denied to conversation
 */
router.get('/:conversationId/messages', rbac('patient', 'staff', 'doctor'), ConversationController.getMessages);

/**
 * @swagger
 * /conversations/{conversationId}/messages/read:
 *   put:
 *     summary: Mark messages as read
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Messages marked as read
 */
router.put('/:conversationId/messages/read', rbac('patient', 'staff', 'doctor'), ConversationController.markMessagesAsRead);

/**
 * @swagger
 * /conversations/{conversationId}:
 *   delete:
 *     summary: Delete conversation
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Conversation deleted successfully
 */
router.delete('/:conversationId', rbac('patient', 'staff', 'doctor'), ConversationController.deleteConversation);

module.exports = router; 