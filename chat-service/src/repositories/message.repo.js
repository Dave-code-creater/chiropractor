const { getDb } = require('../config/index.js');


const saveMessage = async (message) => {
  const db = getDb();
  const result = await db.collection('messages').insertOne(message);
  return { ...message, _id: result.insertedId };
};

const getMessagesByRoom = async (room) => {
  const db = getDb();
  return db.collection('messages').find({ room }).toArray();
};

const getMessagesByUserId = async (userId) => {
  const db = getDb();
  return db
    .collection('messages')
    .find({ $or: [{ sender: userId }, { receiver: userId }] })
    .toArray();
};

module.exports = { saveMessage, getMessagesByRoom, getMessagesByUserId };
