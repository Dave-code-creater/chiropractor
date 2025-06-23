const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const PostController = require('../controllers/post.controller.js');
const jwtMiddleware = require('../middlewares/jwt.middleware.js');
const { rbac } = require('../middlewares/rbac.middleware.js');

const router = Router();

// Health check route (no auth required)
router.get('/', HealthController.healthCheck);

// Apply JWT middleware to all routes below
router.use(jwtMiddleware);

// Public posts routes
router.get('/posts', PostController.list);
router.get('/posts/:id', PostController.getById);

// User-specific posts
router.get('/my-posts', PostController.listPost);

// Doctor-only routes
router.post('/posts', rbac('doctor'), PostController.create);
router.put('/posts/:id', rbac('doctor'), PostController.update);
router.delete('/posts/:id', rbac('doctor'), PostController.delete);

module.exports = router;
