const {
  createPost,
  getPostById,
  listPosts,
  listPostsByUser,
  updatePost,
  deletePost,
} = require('../repositories/post.repo.js');

class PostService {
  static async create(data, userId) {
    const post = {
      title: data.title,
      body: data.body,
      author: data.author,
      tags: data.tags,
      user_id: userId,
      created_at: new Date(),
    };
    return createPost(post);
  }

  static async getById(id) {
    return getPostById(id);
  }

  static async list(options = {}) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'created_at',
      sortOrder = 'desc',
      search = '',
      status = 'published'
    } = options;

    // For now, return basic list with mock pagination
    // In a real implementation, you'd pass these to the repository
    const posts = await listPosts();
    
    // Mock pagination and sorting
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    let filteredPosts = posts;
    
    // Mock search filter
    if (search) {
      filteredPosts = posts.filter(post => 
        post.title?.toLowerCase().includes(search.toLowerCase()) ||
        post.body?.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Mock sorting
    filteredPosts.sort((a, b) => {
      const aValue = a[sortBy] || a.created_at;
      const bValue = b[sortBy] || b.created_at;
      
      if (sortOrder === 'desc') {
        return new Date(bValue) - new Date(aValue);
      }
      return new Date(aValue) - new Date(bValue);
    });
    
    const paginatedPosts = filteredPosts.slice(startIndex, endIndex);
    
    return {
      posts: paginatedPosts,
      pagination: {
        page,
        limit,
        total: filteredPosts.length,
        totalPages: Math.ceil(filteredPosts.length / limit)
      }
    };
  }

  static async listByUser(userId) {
    return listPostsByUser(userId);
  }

  static async update(id, data, userId) {
    const post = {
      title: data.title,
      body: data.body,
      author: data.author,
      tags: data.tags,
      user_id: userId,
    };
    return updatePost(id, post);
  }

  static async delete(id) {
    const existing = await getPostById(id);
    if (!existing) return null;
    await deletePost(id);
    return true;
  }
}

module.exports = PostService;
