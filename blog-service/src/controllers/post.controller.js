const {
  createPost,
  getPostById,
  listPosts,
  listPostsByUser,
  updatePost,
  deletePost,
} = require('../repositories/post.repo.js');
const { CREATED, OK, NotFoundError, InternalServerError } = require('../utils/httpResponses.js');

class PostController {
  static async create(req, res) {
    try {
      const post = await createPost({
        title: req.body.title,
        body: req.body.body,
        author: req.body.author,
        tags: req.body.tags,
        user_id: req.user.sub,
        created_at: new Date(),
      });
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

  static async update(req, res) {
    try {
      const post = await updatePost(req.params.id, {
        title: req.body.title,
        body: req.body.body,
        author: req.body.author,
        tags: req.body.tags,
        user_id: req.user.sub,
      });
      if (!post) return new NotFoundError('not found').send(res);
      return new OK({ metadata: post }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error updating post').send(res);
    }
  }

  static async delete(req, res) {
    try {
      const post = await getPostById(req.params.id);
      if (!post) return new NotFoundError('not found').send(res);
      await deletePost(req.params.id);
      return new OK({ metadata: true }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error deleting post').send(res);
    }
  }

  static async listByUser(req, res) {
    try {
      const posts = await listPostsByUser(Number(req.params.userId));
      return new OK({ metadata: posts }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error listing posts').send(res);
    }
  }
}

module.exports = PostController;
