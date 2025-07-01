const { BadRequestError, NotFoundError, InternalServerError } = require('../utils/httpResponses');
const { getUserRepository } = require('../repositories');
const { info, error: logError, debug, warn } = require('../utils/logger');

/**
 * Blog Service
 * Static methods for blog/content management business logic
 * 
 * Flow: [Controller] -> [Service] -> [Repository] -> [Database]
 */
class BlogService {
  /**
   * Create a new blog post
   * @param {Object} postData - Blog post creation data
   * @param {Object} req - Request object
   * @returns {Object} Blog post creation result
   */
  static async createBlogPost(postData, req) {
    try {
      const userRepo = getUserRepository();

      const {
        title,
        content,
        excerpt,
        category,
        tags = [],
        status = 'draft',
        featured_image_url = null,
        meta_description = null
      } = postData;

      // Basic validation
      if (!title || title.trim().length < 3) {
        throw new BadRequestError('Title must be at least 3 characters long', '4001');
      }

      if (!content || content.trim().length < 10) {
        throw new BadRequestError('Content must be at least 10 characters long', '4002');
      }

      // Generate slug from title
      const slug = BlogService.generateSlug(title);

      // Check if slug already exists
      const existingPost = await userRepo.findBlogPostBySlug(slug);
      if (existingPost) {
        throw new BadRequestError('A blog post with this title already exists', '4003');
      }

      // Create blog post
      const blogPost = await userRepo.createBlogPost({
        title,
        slug,
        content,
        excerpt: excerpt || BlogService.generateExcerpt(content),
        category,
        tags: JSON.stringify(tags),
        status,
        featured_image_url,
        meta_description: meta_description || excerpt || BlogService.generateExcerpt(content),
        author_id: req.user?.id,
        published_at: status === 'published' ? new Date() : null
      });

      info(' Blog post created:', { 
        post_id: blogPost.id,
        title,
        author_id: req.user?.id
      });

      return BlogService.formatBlogPostResponse(blogPost);

    } catch (error) {
      logError('Create blog post service error:', error);
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new InternalServerError('Failed to create blog post', '5001');
    }
  }

  /**
   * Get all blog posts with filtering and pagination
   * @param {Object} query - Query parameters
   * @returns {Object} Paginated blog posts list
   */
  static async getAllBlogPosts(query = {}) {
    try {
      const userRepo = getUserRepository();
      
      const {
        page = 1,
        limit = 10,
        status = 'published',
        category,
        author_id,
        tag,
        search,
        sort_by = 'published_at',
        sort_order = 'desc'
      } = query;

      const offset = (page - 1) * limit;

      const result = await userRepo.findAllBlogPosts({
        status,
        category,
        author_id,
        tag,
        search,
        sort_by,
        sort_order,
        limit: parseInt(limit),
        offset
      });

      info(' Blog posts retrieved:', { 
        count: result.posts.length,
        total: result.total,
        page 
      });

      return {
        posts: result.posts.map(post => BlogService.formatBlogPostResponse(post)),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(result.total / limit),
          total_count: result.total,
          per_page: parseInt(limit),
          has_next: page * limit < result.total,
          has_prev: page > 1
        }
      };

    } catch (error) {
      logError('Get all blog posts service error:', error);
      throw new InternalServerError('Failed to retrieve blog posts', '5002');
    }
  }

  /**
   * Get blog post by ID or slug
   * @param {string} identifier - Post ID or slug
   * @returns {Object} Blog post details
   */
  static async getBlogPost(identifier) {
    try {
      const userRepo = getUserRepository();
      
      let blogPost;
      
      // Check if identifier is numeric (ID) or string (slug)
      if (/^\d+$/.test(identifier)) {
        blogPost = await userRepo.findBlogPostById(parseInt(identifier));
      } else {
        blogPost = await userRepo.findBlogPostBySlug(identifier);
      }

      if (!blogPost) {
        throw new NotFoundError('Blog post not found', '4041');
      }

      // Increment view count
      await userRepo.incrementBlogPostViews(blogPost.id);

      info(' Blog post retrieved:', { post_id: blogPost.id, identifier });

      return BlogService.formatBlogPostResponse(blogPost);

    } catch (error) {
      logError('Get blog post service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to retrieve blog post', '5003');
    }
  }

  /**
   * Update blog post
   * @param {number} postId - Blog post ID
   * @param {Object} updateData - Update data
   * @returns {Object} Updated blog post
   */
  static async updateBlogPost(postId, updateData) {
    try {
      const userRepo = getUserRepository();
      
      const existingPost = await userRepo.findBlogPostById(postId);
      if (!existingPost) {
        throw new NotFoundError('Blog post not found', '4041');
      }

      // Update slug if title is being changed
      if (updateData.title && updateData.title !== existingPost.title) {
        updateData.slug = BlogService.generateSlug(updateData.title);
        
        // Check if new slug already exists
        const existingSlug = await userRepo.findBlogPostBySlug(updateData.slug);
        if (existingSlug && existingSlug.id !== postId) {
          throw new BadRequestError('A blog post with this title already exists', '4003');
        }
      }

      // Update excerpt if content is changed
      if (updateData.content && !updateData.excerpt) {
        updateData.excerpt = BlogService.generateExcerpt(updateData.content);
      }

      // Update published_at if status is changed to published
      if (updateData.status === 'published' && existingPost.status !== 'published') {
        updateData.published_at = new Date();
      }

      // Parse tags if provided
      if (updateData.tags && Array.isArray(updateData.tags)) {
        updateData.tags = JSON.stringify(updateData.tags);
      }

      const updatedPost = await userRepo.updateBlogPost(postId, updateData);

      info(' Blog post updated:', { post_id: postId });

      return BlogService.formatBlogPostResponse(updatedPost);

    } catch (error) {
      logError('Update blog post service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to update blog post', '5004');
    }
  }

  /**
   * Delete blog post
   * @param {number} postId - Blog post ID
   * @returns {boolean} Success status
   */
  static async deleteBlogPost(postId) {
    try {
      const userRepo = getUserRepository();
      
      const existingPost = await userRepo.findBlogPostById(postId);
      if (!existingPost) {
        throw new NotFoundError('Blog post not found', '4041');
      }

      await userRepo.deleteBlogPost(postId);

      info(' Blog post deleted:', { post_id: postId });

      return true;

    } catch (error) {
      logError('Delete blog post service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to delete blog post', '5005');
    }
  }

  /**
   * Get blog categories
   * @returns {Array} Categories list
   */
  static async getBlogCategories() {
    try {
      const userRepo = getUserRepository();
      
      const categories = await userRepo.findBlogCategories();

      info(' Blog categories retrieved:', { count: categories.length });

      return categories;

    } catch (error) {
      logError('Get blog categories service error:', error);
      throw new InternalServerError('Failed to retrieve blog categories', '5006');
    }
  }

  /**
   * Get blog tags
   * @returns {Array} Tags list
   */
  static async getBlogTags() {
    try {
      const userRepo = getUserRepository();
      
      const tags = await userRepo.findBlogTags();

      info(' Blog tags retrieved:', { count: tags.length });

      return tags;

    } catch (error) {
      logError('Get blog tags service error:', error);
      throw new InternalServerError('Failed to retrieve blog tags', '5007');
    }
  }

  /**
   * Generate URL-friendly slug from title
   * @param {string} title - Blog post title
   * @returns {string} URL slug
   */
  static generateSlug(title) {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate excerpt from content
   * @param {string} content - Blog post content
   * @param {number} maxLength - Maximum excerpt length
   * @returns {string} Excerpt
   */
  static generateExcerpt(content, maxLength = 160) {
    if (!content) return '';
    
    // Remove HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, '').trim();
    
    if (plainText.length <= maxLength) {
      return plainText;
    }
    
    // Cut at word boundary
    const truncated = plainText.substring(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
  }

  /**
   * Format blog post response
   * @param {Object} post - Raw blog post data
   * @returns {Object} Formatted blog post
   */
  static formatBlogPostResponse(post) {
    if (!post) return null;

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      category: post.category,
      tags: BlogService.parseJSON(post.tags) || [],
      status: post.status,
      featured_image_url: post.featured_image_url,
      meta_description: post.meta_description,
      author_id: post.author_id,
      author_name: post.author_name || `${post.author_first_name} ${post.author_last_name}`,
      view_count: post.view_count || 0,
      published_at: post.published_at,
      created_at: post.created_at,
      updated_at: post.updated_at
    };
  }

  /**
   * Safely parse JSON string
   * @param {string} jsonString - JSON string to parse
   * @returns {Object|Array|null} Parsed JSON or null
   */
  static parseJSON(jsonString) {
    try {
      return jsonString ? JSON.parse(jsonString) : null;
    } catch (error) {
      logError('Error parsing JSON:', error);
      return null;
    }
  }
}

module.exports = BlogService; 