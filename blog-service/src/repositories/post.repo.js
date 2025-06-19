const { getDb } = require('../config/index.js');
const { ObjectId } = require('mongodb');

const createPost = async (post) => {
  const db = getDb();
  const result = await db.collection('posts').insertOne(post);
  return { ...post, _id: result.insertedId };
};

const getPostById = async (id) => {
  const db = getDb();
  return db.collection('posts').findOne({ _id: new ObjectId(id) });
};

const listPosts = async () => {
  const db = getDb();
  return db.collection('posts').find().toArray();
};

const listPostsByUser = async (userId) => {
  const db = getDb();
  return db.collection('posts').find({ user_id: userId }).toArray();
};

const listPostsByTag = async (tag) => {
  const db = getDb();
  return db.collection('posts').find({ tags: tag }).toArray();
};

const updatePost = async (id, post) => {
  const db = getDb();
  await db.collection('posts').updateOne({ _id: new ObjectId(id) }, { $set: post });
  return getPostById(id);
};

const deletePost = async (id) => {
  const db = getDb();
  await db.collection('posts').deleteOne({ _id: new ObjectId(id) });
};

module.exports = {
  createPost,
  getPostById,
  listPosts,
  listPostsByUser,
  listPostsByTag,
  updatePost,
  deletePost,
};
