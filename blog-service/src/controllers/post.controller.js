const PostService = require('../services/post.service.js');
const { CREATED, OK, NotFoundError, InternalServerError } = require('../utils/httpResponses.js');

class PostController {
  static async create(req, res) {
    try {
      const post = await PostService.create(req.body, req.user.sub);
      return new CREATED({ metadata: post }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error creating post').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const post = await PostService.getById(req.params.id);
      if (!post) return new NotFoundError('not found').send(res);
      return new OK({ metadata: post }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching post').send(res);
    }
  }

  static async list(_req, res) {
    try {
      const posts = await PostService.list();
      return new OK({ metadata: posts }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error listing posts').send(res);
    }
  }

  static async update(req, res) {
    try {
      const post = await PostService.update(
        req.params.id,
        req.body,
        req.user.sub,
      );
      if (!post) return new NotFoundError('not found').send(res);
      return new OK({ metadata: post }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error updating post').send(res);
    }
  }

  static async delete(req, res) {
    try {
      const deleted = await PostService.delete(req.params.id);
      if (!deleted) return new NotFoundError('not found').send(res);
      return new OK({ metadata: true }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error deleting post').send(res);
    }
  }


}

module.exports = PostController;
