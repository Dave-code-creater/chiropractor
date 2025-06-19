const { Router } = require('express');
const PostController = require('../controllers/post.controller.js');
const jwtMiddleware = require('../middlewares/jwt.middleware.js');
const { rbac } = require('../middlewares/rbac.middleware.js');

const router = Router();
router.use(jwtMiddleware);
router.post('/posts', rbac('doctor'), PostController.create);
router.get('/posts', PostController.list);
router.get('/posts/:id', PostController.getById);
router.put('/posts/:id', rbac('doctor'), PostController.update);
router.delete('/posts/:id', rbac('doctor'), PostController.delete);
router.get('/users/:userId/posts', PostController.listUserPosts);
router.get('/tags/:tag/posts', PostController.listByTag);

module.exports = router;
