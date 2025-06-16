// src/routes/index.routes.js
const { Router } = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const HealthController = require('../controllers/health.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = Router();

function setupServiceProxy(path, target, authRequired = true) {
  const proxy = createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^${path}`]: '' },
    logLevel: 'debug',

    onProxyReq(proxyReq, req) {
      // 1) Forward Authorization header if present
      const authHeader = req.headers.authorization || req.headers.Authorization;
      if (authHeader) {
        proxyReq.setHeader('Authorization', authHeader);
      }

      // 2) Forward Client-Id header if present
      const clientId = req.headers['client-id'] || req.headers['Client-Id'];
      if (clientId) {
        proxyReq.setHeader('Client-Id', clientId);
      }

      // 3) Re-attach JSON body (your existing logic)
      if (req.body && Object.keys(req.body).length) {
        const bodyData = JSON.stringify(req.body);

        // remove old Content-Length so we don’t hang
        proxyReq.removeHeader('Content-Length');

        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },

    onProxyRes(proxyRes, req) {
      console.log(`✅ [PROXY_RES] ${req.method} ${req.originalUrl} ← ${proxyRes.statusCode}`);
    },

    onError(err, req, res) {
      console.error(`❌ [PROXY_ERROR] ${req.method} ${req.originalUrl}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Proxy error', message: err.message });
      }
    },
  });

  const stack = [
    (req, res, next) => { console.log(`[GATEWAY] → ${req.method} ${req.originalUrl}`); next(); }
  ];
  if (authRequired) stack.push(authMiddleware);
  stack.push(proxy);
  return stack;
}

// … your router.use(…) calls remain the same …
router.use('/v1/api/2025/auth', ...setupServiceProxy('/v1/api/2025/auth', 'http://auth-service:3001', false));
router.use('/v1/api/2025/users', ...setupServiceProxy('/v1/api/2025/users', 'http://user-service:3002'));
router.use('/v1/api/2025/blog', ...setupServiceProxy('/v1/api/2025/blog', 'http://blog-service:3003'));
router.use('/v1/api/2025/chat', ...setupServiceProxy('/v1/api/2025/chat', 'http://chat-service:3004'));
router.use('/v1/api/2025/appointments', ...setupServiceProxy('/v1/api/2025/appointments', 'http://appointment-service:3005'));
router.get('/', HealthController.healthCheck);
router.use((req, res) => res.status(404).json({ error: 'Not found' }));

module.exports = router;