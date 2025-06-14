const {
  createPost,
  getPostById,
  listPosts,
  updatePost,
  deletePost,
} = require('../repositories/post.repo.js');
const {
  savePostMapping,
  getMappingsByUserId,
  updateMapping,
  deleteMapping,
} = require('../repositories/mapping.repo.js');
const { CREATED, OK, NotFoundError, InternalServerError } = require('../utils/httpResponses.js');

class PostController {
  static async create(req, res) {
    try {
      const post = await createPost({
        title: req.body.title,
        body: req.body.body,
        author: req.body.author,
        tags: req.body.tags,
        created_at: new Date(),
      });
      await savePostMapping({ user_id: req.body.author, mongo_id: String(post._id) });
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
      });
      if (!post) return new NotFoundError('not found').send(res);
      if (req.body.author) {
        await updateMapping(String(post._id), { user_id: req.body.author });
      }
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
      await deleteMapping(String(post._id));
      return new OK({ metadata: true }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error deleting post').send(res);
    }
  }

  static async listByUser(req, res) {
    try {
      const mappings = await getMappingsByUserId(Number(req.params.userId));
      const posts = [];
      for (const map of mappings) {
        const p = await getPostById(map.mongo_id);
        if (p) posts.push(p);
      }
      return new OK({ metadata: posts }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error listing posts').send(res);
    }
  }
}

module.exports = PostController;
