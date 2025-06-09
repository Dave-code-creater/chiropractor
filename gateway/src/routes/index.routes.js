const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const { createProxyMiddleware } = require('http-proxy-middleware');
const authMiddleware = require('../middlewares/auth.middleware.js');

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

router.use(
  '/users',
  authMiddleware,
  createProxyMiddleware({
    target: 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: { '^/users': '/' },
  })
);

module.exports = router;
