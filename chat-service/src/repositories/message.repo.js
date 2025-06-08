import { getDb } from '../config/index.js';
import { ObjectId } from 'mongodb';

export const saveMessage = async (message) => {
  const db = getDb();
  const result = await db.collection('messages').insertOne(message);
  return { ...message, _id: result.insertedId };
};

export const getMessagesByRoom = async (room) => {
  const db = getDb();
  return db.collection('messages').find({ room }).toArray();
};
