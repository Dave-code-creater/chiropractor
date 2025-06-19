const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');

const router = Router();
router.get('/', HealthController.healthCheck);

module.exports = router;
