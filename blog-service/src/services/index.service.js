import { createPost, getPostById, listPosts } from '../repositories/index.repo.js';

export default class BlogService {
  static async createPost(data) {
    const post = { ...data, created_at: new Date() };
    return createPost(post);
  }

  static async getPost(id) {
    return getPostById(id);
  }

  static async listPosts() {
    return listPosts();
  }
}
