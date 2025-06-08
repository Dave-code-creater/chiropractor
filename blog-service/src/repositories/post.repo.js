import { getDb } from '../config/index.js';
import { ObjectId } from 'mongodb';

export const createPost = async (post) => {
  const db = getDb();
  const result = await db.collection('posts').insertOne(post);
  return { ...post, _id: result.insertedId };
};

export const getPostById = async (id) => {
  const db = getDb();
  return db.collection('posts').findOne({ _id: new ObjectId(id) });
};

export const listPosts = async () => {
  const db = getDb();
  return db.collection('posts').find().toArray();
};
