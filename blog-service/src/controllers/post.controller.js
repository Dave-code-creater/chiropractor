import { createPost, getPostById, listPosts } from '../repositories/index.repo.js';
import { CREATED, OK, NotFoundError, InternalServerError } from '../utils/httpResponses.js';

export default class PostController {
  static async create(req, res) {
    try {
      const post = await createPost({ title: req.body.title, body: req.body.body, author: req.body.author, tags: req.body.tags, created_at: new Date() });
      return new CREATED({ metadata: post }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error creating post').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const post = await getPostById(req.params.id);
      if (!post) return new NotFoundError('not found').send(res);
      return new OK({ metadata: post }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching post').send(res);
    }
  }

  static async list(_req, res) {
    try {
      const posts = await listPosts();
      return new OK({ metadata: posts }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error listing posts').send(res);
    }
  }
}
