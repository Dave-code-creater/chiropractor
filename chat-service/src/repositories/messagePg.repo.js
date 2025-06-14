const { getPgDb } = require('../config/index.js');

const createMessageRecord = async (senderId, receiverId, mongoId) => {
  const db = getPgDb();
  const [row] = await db
    .insertInto('messages')
    .values({ sender_id: senderId, receiver_id: receiverId, mongo_id: mongoId })
    .returningAll()
    .execute();
  return row;
};

const getMessageRecordsByUserId = async (userId) => {
  const db = getPgDb();
  return db
    .selectFrom('messages')
    .selectAll()
    .where('sender_id', '=', userId)
    .orWhere('receiver_id', '=', userId)
    .execute();
};

module.exports = { createMessageRecord, getMessageRecordsByUserId };
