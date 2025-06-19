const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const asyncHandler = require('../helper/asyncHandler.js');

const router = Router();
router.get('/', asyncHandler(HealthController.healthCheck));

module.exports = router;
