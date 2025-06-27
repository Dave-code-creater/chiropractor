const express = require('express');
const ChatController = require('../controllers/chat.controller');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Conversation management routes
router.get('/conversations', asyncHandler(ChatController.getConversations));
router.post('/conversations', asyncHandler(ChatController.createConversation));
router.post('/conversations/doctor-patient', asyncHandler(ChatController.createDoctorPatientConversation));

// Message management routes
router.post('/messages', asyncHandler(ChatController.sendMessage));
router.get('/conversations/:conversation_id/messages', asyncHandler(ChatController.getMessages));

module.exports = router; 