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

module.exports = {
  createPost,
  getPostById,
  listPosts,
};
