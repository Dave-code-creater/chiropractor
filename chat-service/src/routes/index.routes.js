const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const chatRoutes = require('./chat.routes.js');

const router = Router();

router.get('/', HealthController.healthCheck);
router.use('/api', chatRoutes);

module.exports = router;
