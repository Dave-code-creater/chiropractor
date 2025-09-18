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

/**
 * @swagger
 * tags:
 *   name: Blog
 *   description: Content management endpoints for clinic articles and news
 */

// Public routes
/**
 * @swagger
 * /blog/posts:
 *   get:
 *     summary: List blog posts
 *     description: Returns published posts for public users or all posts for authorized staff.
 *     tags: [Blog]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, archived, all]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, title]
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedResponse'
 */
router.get('/posts', optionalAuth, asyncHandler(BlogController.getAllPosts));
/**
 * @swagger
 * /blog/posts/{identifier}:
 *   get:
 *     summary: Get blog post by ID or slug
 *     tags: [Blog]
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: Numeric ID or slug of the blog post
 *     responses:
 *       200:
 *         description: Blog post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       404:
 *         description: Blog post not found
 */
router.get('/posts/:identifier', asyncHandler(BlogController.getPost));
/**
 * @swagger
 * /blog/categories:
 *   get:
 *     summary: List blog categories
 *     tags: [Blog]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 */
router.get('/categories', asyncHandler(BlogController.getCategories));

// Protected routes
/**
 * @swagger
 * /blog/posts:
 *   post:
 *     summary: Create a new blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlogPostRequest'
 *     responses:
 *       201:
 *         description: Blog post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Validation error
 */
router.post('/posts', authenticate, authorize('admin', 'doctor'), asyncHandler(BlogController.createPost));
/**
 * @swagger
 * /blog/posts/{id}:
 *   put:
 *     summary: Update an existing blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BlogPostRequest'
 *     responses:
 *       200:
 *         description: Blog post updated successfully
 *       404:
 *         description: Blog post not found
 */
router.put('/posts/:id', authenticate, authorize('admin', 'doctor'), asyncHandler(BlogController.updatePost));
/**
 * @swagger
 * /blog/posts/{id}:
 *   delete:
 *     summary: Delete a blog post
 *     tags: [Blog]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Blog post deleted successfully
 *       404:
 *         description: Blog post not found
 */
router.delete('/posts/:id', authenticate, authorize('admin', 'doctor'), asyncHandler(BlogController.deletePost));

module.exports = router;
