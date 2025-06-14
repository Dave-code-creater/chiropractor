const { getMongoDb } = require('../config/index.js');
const { ObjectId } = require('mongodb');

const createPost = async (post) => {
  const db = getMongoDb();
  const result = await db.collection('posts').insertOne(post);
  return { ...post, _id: result.insertedId };
};

const getPostById = async (id) => {
  const db = getMongoDb();
  return db.collection('posts').findOne({ _id: new ObjectId(id) });
};

const listPosts = async () => {
  const db = getMongoDb();
  return db.collection('posts').find().toArray();
};

const updatePost = async (id, post) => {
  const db = getMongoDb();
  await db.collection('posts').updateOne({ _id: new ObjectId(id) }, { $set: post });
  return getPostById(id);
};

const deletePost = async (id) => {
  const db = getMongoDb();
  await db.collection('posts').deleteOne({ _id: new ObjectId(id) });
};

module.exports = {
  createPost,
  getPostById,
  listPosts,
  updatePost,
  deletePost,
};
