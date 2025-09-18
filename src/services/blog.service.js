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
        is_published = false,
        featured_image,
        meta_description,
        slug: customSlug
      } = postData;

      // Basic validation
      if (!title || title.trim().length < 3) {
        throw new BadRequestError('Title must be at least 3 characters long', '4001');
      }

      if (!content || !Array.isArray(content) || content.length === 0) {
        throw new BadRequestError('Content must be a non-empty array', '4002');
      }

      // Validate content structure
      const isValidContent = content.every(item =>
        item && typeof item === 'object' && item.type && item.text
      );
      if (!isValidContent) {
        throw new BadRequestError('Content must be array of objects with type and text properties', '4003');
      }

      // Generate slug from title or use custom slug
      const slug = customSlug || BlogService.generateSlug(title);

      // Check if slug already exists
      const existingPost = await userRepo.findBlogPostBySlug(slug);
      if (existingPost) {
        throw new BadRequestError('A blog post with this title already exists', '4004');
      }

      // Determine status from is_published flag
      const status = is_published ? 'published' : 'draft';

      // Create blog post
      const blogPost = await userRepo.createBlogPost({
        title,
        slug,
        content,
        excerpt: excerpt || BlogService.generateExcerptFromContent(content),
        category,
        tags,
        status,
        featured_image_url: featured_image,
        meta_description: meta_description || excerpt || BlogService.generateExcerptFromContent(content),
        author_id: req.user?.id
      });

      // Hydrate author context for immediate response formatting
      blogPost.first_name = req.user?.first_name || req.user?.firstName || null;
      blogPost.last_name = req.user?.last_name || req.user?.lastName || null;
      blogPost.role = req.user?.role || null;
      blogPost.username = req.user?.username || req.user?.email || null;

      info(' Blog post created:', {
        post_id: blogPost.id,
        title,
        author_id: req.user?.id,
        status
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
   * @param {Object} user - User object (null for public access)
   * @returns {Object} Paginated blog posts list
   */
  static async getAllBlogPosts(query = {}, user = null) {
    try {
      const userRepo = getUserRepository();

      const {
        page = 1,
        limit = 10,
        status,
        category,
        author_id,
        tag,
        search,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = query;

      // Determine allowed statuses based on user role
      let finalStatus;

      if (user && ['admin', 'doctor'].includes(user.role)) {
        // Authenticated doctor/admin can see all posts or filter by specific status
        if (status === 'all') {
          finalStatus = null; // Show all statuses
        } else {
          finalStatus = status || null; // Use provided status or show all
        }
      } else {
        // Public users can only see published posts
        finalStatus = 'published';
      }

      const offset = (page - 1) * limit;

      const result = await userRepo.findAllBlogPosts({
        status: finalStatus,
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

      const pagination = {
        current_page: parseInt(page),
        total_pages: Math.ceil(result.total / limit),
        total_count: result.total,
        per_page: parseInt(limit),
        has_next: page * limit < result.total,
        has_prev: page > 1
      };

      return {
        posts: result.posts.map(post => BlogService.formatBlogPostResponse(post)),
        meta: { pagination },
        // Retain pagination at top-level for backward compatibility while frontends migrate to meta.pagination
        pagination
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

      // Transform is_published to status
      if (updateData.is_published !== undefined) {
        updateData.status = updateData.is_published ? 'published' : 'draft';
        delete updateData.is_published;
      }

      // Transform featured_image to featured_image_url
      if (updateData.featured_image !== undefined) {
        updateData.featured_image_url = updateData.featured_image;
        delete updateData.featured_image;
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

      // Validate content structure if provided
      if (updateData.content) {
        if (!Array.isArray(updateData.content) || updateData.content.length === 0) {
          throw new BadRequestError('Content must be a non-empty array', '4002');
        }

        const isValidContent = updateData.content.every(item =>
          item && typeof item === 'object' && item.type && item.text
        );
        if (!isValidContent) {
          throw new BadRequestError('Content must be array of objects with type and text properties', '4003');
        }

        // Update excerpt if content is changed
        if (!updateData.excerpt) {
          updateData.excerpt = BlogService.generateExcerptFromContent(updateData.content);
        }
      }

      // Update published_at if status is changed to published
      if (updateData.status === 'published' && existingPost.status !== 'published') {
        updateData.published_at = new Date();
      }

      const updatedPost = await userRepo.updateBlogPost(postId, updateData);

      // Merge existing relational fields (e.g., author details) with updated data
      const hydratedPost = {
        ...existingPost,
        ...updatedPost
      };

      info(' Blog post updated:', { post_id: postId });

      return BlogService.formatBlogPostResponse(hydratedPost);

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
   * Generate excerpt from content array
   * @param {Array} content - Blog post content array
   * @param {number} maxLength - Maximum excerpt length
   * @returns {string} Generated excerpt
   */
  static generateExcerptFromContent(content, maxLength = 160) {
    if (!content || !Array.isArray(content) || content.length === 0) return '';

    // Extract text from all content blocks
    const plainText = content
      .map(item => item.text || '')
      .join(' ')
      .trim();

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

    const contentBlocks = BlogService.parseJSON(post.content) || [];
    const tags = BlogService.parseJSON(post.tags) || [];
    const wordCount = BlogService.calculateWordCount(contentBlocks);

    const status = post.status || (post.is_published ? 'published' : 'draft');

    return {
      id: post.id,
      type: 'blog_post',
      attributes: {
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: {
          blocks: contentBlocks,
          word_count: wordCount,
          reading_time_minutes: BlogService.calculateReadingTime(wordCount)
        },
        taxonomy: {
          category: post.category
            ? {
                name: post.category,
                slug: BlogService.generateSlug(post.category)
              }
            : null,
          tags
        },
        media: {
          featured_image: post.featured_image_url || null
        },
        meta: {
          description: post.meta_description || null
        },
        status: {
          is_published: status === 'published',
          state: status
        },
        timestamps: {
          published_at: post.published_at || null,
          created_at: post.created_at,
          updated_at: post.updated_at
        }
      },
      relationships: {
        author: {
          id: post.author_id || null,
          name: BlogService.buildAuthorName(post),
          role: post.role || null,
          initials: BlogService.buildAuthorInitials(post)
        }
      },
      metrics: {
        view_count: post.view_count || 0
      }
    };
  }

  /**
   * Safely parse JSON string or return if already parsed
   * @param {string|Object|Array} data - JSON string or already parsed data
   * @returns {Object|Array|null} Parsed JSON or original data
   */
  static parseJSON(data) {
    try {
      // If data is null or undefined, return null
      if (!data) return null;

      // If data is already an object or array, return it as-is
      if (typeof data === 'object') return data;

      // If data is a string, try to parse it
      if (typeof data === 'string') {
        return JSON.parse(data);
      }

      // For any other type, return null
      return null;
    } catch (error) {
      logError('Error parsing JSON:', error);
      return null;
    }
  }

  /**
   * Build author full name from available fields
   * @param {Object} post
   * @returns {string|null}
   */
  static buildAuthorName(post) {
    const firstName = post.first_name || post.author_first_name || '';
    const lastName = post.last_name || post.author_last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();

    if (fullName) {
      return fullName;
    }

    if (post.author_name) {
      return post.author_name;
    }

    if (post.username) {
      return post.username;
    }

    return null;
  }

  /**
   * Build author initials from name data
   * @param {Object} post
   * @returns {string|null}
   */
  static buildAuthorInitials(post) {
    const name = BlogService.buildAuthorName(post);

    if (!name) {
      return null;
    }

    const parts = name.split(' ').filter(Boolean);
    if (!parts.length) {
      return null;
    }

    const initials = parts.map(part => part.charAt(0).toUpperCase()).join('');
    return initials || null;
  }

  /**
   * Calculate word count from content blocks
   * @param {Array} contentBlocks
   * @returns {number}
   */
  static calculateWordCount(contentBlocks) {
    if (!Array.isArray(contentBlocks) || contentBlocks.length === 0) {
      return 0;
    }

    return contentBlocks.reduce((total, block) => {
      if (!block || typeof block.text !== 'string') {
        return total;
      }

      const words = block.text.trim().split(/\s+/).filter(Boolean);
      return total + words.length;
    }, 0);
  }

  /**
   * Estimate reading time in minutes based on word count
   * @param {number} wordCount
   * @param {number} wordsPerMinute
   * @returns {number}
   */
  static calculateReadingTime(wordCount, wordsPerMinute = 200) {
    if (!wordCount || wordCount <= 0) {
      return 0;
    }

    return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
  }
}

module.exports = BlogService; 
