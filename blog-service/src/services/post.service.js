const {
  createPost,
  getPostById,
  listPosts,
  listPostsByUser,
  listPostsByTag,
  updatePost,
  deletePost,
} = require('../repositories/post.repo.js');
const { publish } = require('../utils/messageBroker.js');

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
    const created = await createPost(post);
    await publish('posts.created', created);
    return created;
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

  static async listByTag(tag) {
    return listPostsByTag(tag);
  }

  static async update(id, data, userId) {
    const post = {
      title: data.title,
      body: data.body,
      author: data.author,
      tags: data.tags,
      user_id: userId,
    };
    const updated = await updatePost(id, post);
    if (updated) await publish('posts.updated', updated);
    return updated;
  }

  static async delete(id) {
    const existing = await getPostById(id);
    if (!existing) return null;
    await deletePost(id);
    await publish('posts.deleted', { id });
    return true;
  }
}

module.exports = PostService;
