const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const BlogController = require('../controllers/blog.controller');

const router = express.Router();

const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    authenticate(req, res, (err) => {
      next();
    });
  } else {
    req.user = null;
    next();
  }
};

// Public routes
router.get('/posts', optionalAuth, asyncHandler(BlogController.getAllPosts));
router.get('/posts/:identifier', asyncHandler(BlogController.getPost));
router.get('/categories', asyncHandler(BlogController.getCategories));

// Protected routes
router.post('/posts', authenticate, authorize('admin', 'doctor'), asyncHandler(BlogController.createPost));
router.put('/posts/:id', authenticate, authorize('admin', 'doctor'), asyncHandler(BlogController.updatePost));
router.delete('/posts/:id', authenticate, authorize('admin', 'doctor'), asyncHandler(BlogController.deletePost));

module.exports = router;