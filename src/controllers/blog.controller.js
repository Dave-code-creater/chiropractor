const BlogService = require('../services/blog.service');
const { SuccessResponse, ErrorResponse } = require('../utils/httpResponses');
const { info, error: logError } = require('../utils/logger');
const { getRealClientIP } = require('../utils/ip');

/**
 * Blog Controller
 * Handles HTTP requests for blog functionality
 */
class BlogController {
  /**
   * Get all blog posts (PUBLIC/AUTHENTICATED)
   * GET /blog/posts
   * Query params: category, status, page, limit, tag, search, sort_by, sort_order
   * 
   * Access Control:
   * - Public users: Only see published posts
   * - Admin/Doctor: Can see all posts (draft + published)
   */
  static async getAllPosts(req, res) {
    try {
      const userRole = req.user?.role || null;
      const isAuthenticated = !!req.user;

      info('📖 Getting all blog posts:', {
        query: req.query,
        user_role: userRole,
        is_authenticated: isAuthenticated,
        ip: getRealClientIP(req)
      });

      const result = await BlogService.getAllBlogPosts(req.query, req.user);

      const response = new SuccessResponse(
        'Blog posts retrieved successfully',
        200,
        {
          posts: result.posts,
          meta: result.meta,
          pagination: result.pagination
        }
      );
      response.send(res);

    } catch (error) {
      logError('Get all blog posts controller error:', error);
      const errorResponse = new ErrorResponse(
        error.message || 'Failed to retrieve blog posts',
        error.statusCode || 500,
        error.code || 'BLOG_FETCH_ERROR'
      );
      errorResponse.send(res);
    }
  }

  /**
   * Get single blog post by ID or slug (PUBLIC)
   * GET /blog/posts/:identifier
   */
  static async getPost(req, res) {
    try {
      const { identifier } = req.params;

      info('📖 Getting blog post:', {
        identifier,
        ip: getRealClientIP(req)
      });

      const post = await BlogService.getBlogPost(identifier);

      const response = new SuccessResponse(
        'Blog post retrieved successfully',
        200,
        { post }
      );
      response.send(res);

    } catch (error) {
      logError('Get blog post controller error:', error);
      const errorResponse = new ErrorResponse(
        error.message || 'Failed to retrieve blog post',
        error.statusCode || 500,
        error.code || 'BLOG_FETCH_ERROR'
      );
      errorResponse.send(res);
    }
  }

  /**
   * Get blog categories (PUBLIC)
   * GET /blog/categories
   */
  static async getCategories(req, res) {
    try {
      info('📖 Getting blog categories:', { ip: getRealClientIP(req) });

      const categories = await BlogService.getBlogCategories();

      const response = new SuccessResponse(
        'Blog categories retrieved successfully',
        200,
        categories
      );
      response.send(res);

    } catch (error) {
      logError('Get blog categories controller error:', error);
      const errorResponse = new ErrorResponse(
        error.message || 'Failed to retrieve blog categories',
        error.statusCode || 500,
        error.code || 'BLOG_CATEGORIES_ERROR'
      );
      errorResponse.send(res);
    }
  }

  /**
   * Create new blog post (PROTECTED - admin, doctor)
   * POST /blog/posts
   */
  static async createPost(req, res) {
    try {
      info('📝 Creating blog post:', {
        title: req.body.title,
        author_id: req.user?.id,
        role: req.user?.role
      });

      // Only allow publish if user is admin or doctor
      if (req.body.is_published && !['admin', 'doctor'].includes(req.user?.role)) {
        req.body.is_published = false; // Force draft for non-authorized users
        info('⚠️ Forcing draft status for non-authorized user:', {
          user_role: req.user?.role
        });
      }

      const post = await BlogService.createBlogPost(req.body, req);

      const response = new SuccessResponse(
        'Blog post created successfully',
        201,
        { post }
      );
      response.send(res);

    } catch (error) {
      logError('Create blog post controller error:', error);
      const errorResponse = new ErrorResponse(
        error.message || 'Failed to create blog post',
        error.statusCode || 500,
        error.code || 'BLOG_CREATE_ERROR'
      );
      errorResponse.send(res);
    }
  }

  /**
   * Update blog post (PROTECTED - admin, doctor)
   * PUT /blog/posts/:id
   */
  static async updatePost(req, res) {
    try {
      const { id } = req.params;

      info('📝 Updating blog post:', {
        post_id: id,
        author_id: req.user?.id,
        role: req.user?.role
      });

      // Only allow publish if user is admin or doctor
      if (req.body.is_published && !['admin', 'doctor'].includes(req.user?.role)) {
        req.body.is_published = false; // Force draft for non-authorized users
        info('⚠️ Forcing draft status for non-authorized user:', {
          user_role: req.user?.role
        });
      }

      const post = await BlogService.updateBlogPost(parseInt(id), req.body);

      const response = new SuccessResponse(
        'Blog post updated successfully',
        200,
        { post }
      );
      response.send(res);

    } catch (error) {
      logError('Update blog post controller error:', error);
      const errorResponse = new ErrorResponse(
        error.message || 'Failed to update blog post',
        error.statusCode || 500,
        error.code || 'BLOG_UPDATE_ERROR'
      );
      errorResponse.send(res);
    }
  }

  /**
   * Delete blog post (PROTECTED - admin, doctor)
   * DELETE /blog/posts/:id
   */
  static async deletePost(req, res) {
    try {
      const { id } = req.params;

      info('🗑️ Deleting blog post:', {
        post_id: id,
        author_id: req.user?.id,
        role: req.user?.role
      });

      await BlogService.deleteBlogPost(parseInt(id));

      const response = new SuccessResponse(
        'Blog post deleted successfully',
        200,
        {
          post: {
            id: parseInt(id, 10),
            status: { deleted: true }
          }
        }
      );
      response.send(res);

    } catch (error) {
      logError('Delete blog post controller error:', error);
      const errorResponse = new ErrorResponse(
        error.message || 'Failed to delete blog post',
        error.statusCode || 500,
        error.code || 'BLOG_DELETE_ERROR'
      );
      errorResponse.send(res);
    }
  }
}

module.exports = BlogController; 
