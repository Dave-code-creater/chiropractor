import { CREATED, OK, NotFoundError, InternalServerError, ErrorResponse } from '../utils/httpResponses.js';
import BlogService from '../services/index.service.js';

export default class PostController {
  static async create(req, res) {
    try {
      const post = await BlogService.createPost({
        title: req.body.title,
        body: req.body.body,
        author: req.body.author,
        tags: req.body.tags
      });
      return new CREATED({ metadata: post }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error creating post').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const post = await BlogService.getPost(req.params.id);
      if (!post) return new NotFoundError('not found').send(res);
      return new OK({ metadata: post }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error fetching post').send(res);
    }
  }

  static async list(_req, res) {
    try {
      const posts = await BlogService.listPosts();
      return new OK({ metadata: posts }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error listing posts').send(res);
    }
  }
}
