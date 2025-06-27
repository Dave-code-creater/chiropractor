const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const conversationRoutes = require('./conversation.routes.js');
const messageRoutes = require('./message.routes.js');
const userRoutes = require('./user.routes.js');

const router = Router();

router.get('/', HealthController.healthCheck);
router.use('/conversations', conversationRoutes);
router.use('/messages', messageRoutes);
router.use('/users', userRoutes);

module.exports = router;
