import { createPost, getPostById, listPosts } from '../repositories/index.repo.js';

export const create = async (req, res) => {
  try {
    const post = await createPost({ title: req.body.title, body: req.body.body, author: req.body.author, tags: req.body.tags, created_at: new Date() });
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error creating post' });
  }
};

export const getById = async (req, res) => {
  try {
    const post = await getPostById(req.params.id);
    if (!post) return res.status(404).json({ message: 'not found' });
    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error fetching post' });
  }
};

export const list = async (req, res) => {
  try {
    const posts = await listPosts();
    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'error listing posts' });
  }
};
