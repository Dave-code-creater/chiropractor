const { Router } = require('express');
const jwtMiddleware = require('../middlewares/jwt.middleware.js');
const { rbac, patientRestriction } = require('../middlewares/rbac.middleware.js');
const ChatController = require('../controllers/chat.controller.js');

const router = Router();

router.use(jwtMiddleware);

// Create a new conversation
router.post(
  '/conversations',
  rbac('patient', 'staff', 'doctor'),
  patientRestriction,
  ChatController.createConversation
);

// Get all conversations for the current user
router.get(
  '/conversations',
  rbac('patient', 'staff', 'doctor'),
  ChatController.getConversations
);

// Get messages for a specific conversation
router.get(
  '/conversations/:id/messages',
  rbac('patient', 'staff', 'doctor'),
  ChatController.getConversationMessages
);

// Send a message to a conversation
router.post(
  '/messages',
  rbac('patient', 'staff', 'doctor'),
  ChatController.sendMessage
);

module.exports = router;
