const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Health check
 *     responses:
 *       200:
 *         description: OK
 */
router.get('/', HealthController.healthCheck);

module.exports = router;
