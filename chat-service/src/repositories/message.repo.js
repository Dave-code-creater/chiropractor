const { getMongoDb } = require('../config/index.js');
const { ObjectId } = require('mongodb');

const saveMessage = async (message) => {
  const db = getMongoDb();
  const result = await db.collection('messages').insertOne(message);
  return { ...message, _id: result.insertedId };
};

const getMessagesByRoom = async (room) => {
  const db = getMongoDb();
  return db.collection('messages').find({ room }).toArray();
};

const getMessagesByIds = async (ids) => {
  const db = getMongoDb();
  const objIds = ids.map((id) => new ObjectId(id));
  return db.collection('messages').find({ _id: { $in: objIds } }).toArray();
};
module.exports = { saveMessage, getMessagesByRoom, getMessagesByIds };
