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

  static async list() {
    return listPosts();
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
