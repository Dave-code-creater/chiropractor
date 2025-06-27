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

        // remove old Content-Length so we don't hang
        proxyReq.removeHeader('Content-Length');

        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },

    onProxyRes(proxyRes, req) {
      // Silent proxy response logging
    },

    onError(err, req, res) {
      console.error(`❌ [PROXY_ERROR] ${req.method} ${req.originalUrl}:`, err.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Proxy error', message: err.message });
      }
    },
  });

  const stack = [
    (req, res, next) => { next(); }
  ];
  if (authRequired) stack.push(authMiddleware);
  stack.push(proxy);
  return stack;
}

// Service proxy routes
router.use('/v1/api/2025/auth', ...setupServiceProxy('/v1/api/2025/auth', 'http://auth-service:3001', false));
// Backward compatibility - simple auth routes
router.use('/auth', ...setupServiceProxy('/auth', 'http://auth-service:3001', false));
router.use('/v1/api/2025/users', ...setupServiceProxy('/v1/api/2025/users', 'http://user-service:3002'));
router.use('/v1/api/2025/reports', ...setupServiceProxy('/v1/api/2025/reports', 'http://report-service:3006'));
router.use('/v1/api/2025/blog', ...setupServiceProxy('/v1/api/2025/blog', 'http://blog-service:3003'));
// Special proxy for conversations that routes to chat service
const conversationsProxy = createProxyMiddleware({
  target: 'http://chat-service:3004',
  changeOrigin: true,
  pathRewrite: { '^/v1/api/2025/conversations': '/conversations' },
  logLevel: 'debug',
  onProxyReq(proxyReq, req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader) {
      proxyReq.setHeader('Authorization', authHeader);
    }
    const clientId = req.headers['client-id'] || req.headers['Client-Id'];
    if (clientId) {
      proxyReq.setHeader('Client-Id', clientId);
    }
    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.removeHeader('Content-Length');
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError(err, req, res) {
    console.error(`❌ [PROXY_ERROR] ${req.method} ${req.originalUrl}:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Proxy error', message: err.message });
    }
  }
});

// Special proxy for messages that routes to chat service
const messagesProxy = createProxyMiddleware({
  target: 'http://chat-service:3004',
  changeOrigin: true,
  pathRewrite: { '^/v1/api/2025/messages': '/messages' },
  logLevel: 'debug',
  onProxyReq(proxyReq, req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader) {
      proxyReq.setHeader('Authorization', authHeader);
    }
    const clientId = req.headers['client-id'] || req.headers['Client-Id'];
    if (clientId) {
      proxyReq.setHeader('Client-Id', clientId);
    }
    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.removeHeader('Content-Length');
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError(err, req, res) {
    console.error(`❌ [PROXY_ERROR] ${req.method} ${req.originalUrl}:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Proxy error', message: err.message });
    }
  }
});

router.use('/v1/api/2025/conversations', conversationsProxy);
router.use('/v1/api/2025/messages', messagesProxy);
// Special proxy for appointments that preserves the /appointments path
const appointmentsProxy = createProxyMiddleware({
  target: 'http://appointment-service:3005',
  changeOrigin: true,
  pathRewrite: { '^/v1/api/2025/appointments': '/appointments' },
  logLevel: 'debug',
  onProxyReq(proxyReq, req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader) {
      proxyReq.setHeader('Authorization', authHeader);
    }
    const clientId = req.headers['client-id'] || req.headers['Client-Id'];
    if (clientId) {
      proxyReq.setHeader('Client-Id', clientId);
    }
    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.removeHeader('Content-Length');
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError(err, req, res) {
    console.error(`❌ [PROXY_ERROR] ${req.method} ${req.originalUrl}:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Proxy error', message: err.message });
    }
  }
});

router.use('/v1/api/2025/appointments', appointmentsProxy);

// Special proxy for doctors that preserves the /doctors path
const doctorsProxy = createProxyMiddleware({
  target: 'http://appointment-service:3005',
  changeOrigin: true,
  pathRewrite: { '^/v1/api/2025/doctors': '/doctors' },
  logLevel: 'debug',
  onProxyReq(proxyReq, req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader) {
      proxyReq.setHeader('Authorization', authHeader);
    }
    const clientId = req.headers['client-id'] || req.headers['Client-Id'];
    if (clientId) {
      proxyReq.setHeader('Client-Id', clientId);
    }
    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.removeHeader('Content-Length');
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError(err, req, res) {
    console.error(`❌ [PROXY_ERROR] ${req.method} ${req.originalUrl}:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Proxy error', message: err.message });
    }
  }
});

router.use('/v1/api/2025/doctors', doctorsProxy);

// Special proxy for chat users (like /users/doctors) that routes to chat service
const chatUsersProxy = createProxyMiddleware({
  target: 'http://chat-service:3004',
  changeOrigin: true,
  pathRewrite: { '^/v1/api/2025/users': '/users' },
  logLevel: 'debug',
  onProxyReq(proxyReq, req) {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader) {
      proxyReq.setHeader('Authorization', authHeader);
    }
    const clientId = req.headers['client-id'] || req.headers['Client-Id'];
    if (clientId) {
      proxyReq.setHeader('Client-Id', clientId);
    }
    if (req.body && Object.keys(req.body).length) {
      const bodyData = JSON.stringify(req.body);
      proxyReq.removeHeader('Content-Length');
      proxyReq.setHeader('Content-Type', 'application/json');
      proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
      proxyReq.write(bodyData);
    }
  },
  onError(err, req, res) {
    console.error(`❌ [PROXY_ERROR] ${req.method} ${req.originalUrl}:`, err.message);
    if (!res.headersSent) {
      res.status(502).json({ error: 'Proxy error', message: err.message });
    }
  }
});

// Add chat users routes BEFORE the general users route
router.use('/v1/api/2025/users/doctors', chatUsersProxy);
router.use('/v1/api/2025/users/staff', chatUsersProxy);
router.use('/v1/api/2025/users/search', chatUsersProxy);

router.use((req, res) => res.status(404).json({ error: 'Not found' }));

module.exports = router;