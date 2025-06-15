const { Router } = require('express');
const HealthController = require('../controllers/health.controller.js');
const PostController = require('../controllers/post.controller.js');
const jwtMiddleware = require('../middlewares/jwt.middleware.js');
const { rbac } = require('../middlewares/rbac.middleware.js');

const router = Router();


router.get('/', HealthController.healthCheck);
router.use(jwtMiddleware);
router.post('/posts', rbac('doctor'), PostController.create);
router.get("/posts", PostController.listPost);
router.get('/posts/:id', PostController.getById);
router.put('/posts/:id', rbac('doctor'), PostController.update);
router.delete('/posts/:id', rbac('doctor'), PostController.delete);
router.get('/posts', PostController.list);


module.exports = router;
