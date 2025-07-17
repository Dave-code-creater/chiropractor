const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const BlogController = require('../controllers/blog.controller');

const router = express.Router();

/**
 * Optional authentication middleware
 * Checks for authentication but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  // Check if Authorization header is present
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    // If token is present, try to authenticate
    authenticate(req, res, (err) => {
      // Continue regardless of authentication result
      // req.user will be set if authentication succeeds, null otherwise
      next();
    });
  } else {
    // No token provided, continue as public user
    req.user = null;
    next();
  }
};

/**
 * ===============================================
 * BLOG API ROUTES
 * ===============================================
 * 
 * 🌍 PUBLIC ACCESS - No authentication required
 * - Public users see only PUBLISHED posts
 * - Great for attracting visitors to the clinic
 * 
 * 🔒 AUTHENTICATED ACCESS - Optional authentication
 * - Admin/Doctor/Staff see ALL posts (draft + published)
 * - Perfect for content management and preview
 * 
 * 🛡️ PROTECTED ROUTES - Authentication required
 * - Only admin, doctor, staff can manage blog posts
 */

// ===============================================
// 🌍 PUBLIC BLOG ROUTES (No Auth Required)
// ===============================================

/**
 * Get all blog posts (PUBLIC + AUTHENTICATED)
 * GET /blog/posts?category=string&status=string&page=number&limit=number&tag=string&search=string
 * 
 * Access Control:
 * - 🌍 Public (no auth): Only published posts
 * - 🔒 Admin/Doctor/Staff: All posts (draft + published)
 * 
 * Perfect for:
 * - Clinic website visitors browsing health articles
 * - SEO and attracting new patients
 * - Staff previewing draft content
 */
router.get('/posts', optionalAuth, asyncHandler(BlogController.getAllPosts));

/**
 * Get single blog post by ID or slug (PUBLIC)
 * GET /blog/posts/:identifier
 * 
 * Perfect for:
 * - Direct links to specific articles
 * - Social media sharing
 * - Deep linking from search engines
 */
router.get('/posts/:identifier', asyncHandler(BlogController.getPost));

/**
 * Get blog categories (PUBLIC)
 * GET /blog/categories
 * 
 * Perfect for:
 * - Building navigation menus
 * - Filtering blog posts by topic
 * - Organizing content for visitors
 */
router.get('/categories', asyncHandler(BlogController.getCategories));

// ===============================================
// 🔒 PROTECTED BLOG MANAGEMENT ROUTES
// ===============================================

/**
 * Create new blog post (PROTECTED)
 * POST /blog/posts
 * Body: { title, content, excerpt, category, tags, is_published, featured_image, meta_description, slug }
 * Auth: admin, doctor, staff only
 */
router.post('/posts', 
  authenticate,
  authorize(['admin', 'doctor', 'staff']),
  asyncHandler(BlogController.createPost)
);

/**
 * Update existing blog post (PROTECTED)
 * PUT /blog/posts/:id
 * Body: { title, content, excerpt, category, tags, is_published, featured_image, meta_description }
 * Auth: admin, doctor, staff only
 */
router.put('/posts/:id', 
  authenticate,
  authorize(['admin', 'doctor', 'staff']),
  asyncHandler(BlogController.updatePost)
);

/**
 * Delete blog post (PROTECTED)
 * DELETE /blog/posts/:id
 * Auth: admin, doctor, staff only
 */
router.delete('/posts/:id', 
  authenticate,
  authorize(['admin', 'doctor', 'staff']),
  asyncHandler(BlogController.deletePost)
);

module.exports = router; 