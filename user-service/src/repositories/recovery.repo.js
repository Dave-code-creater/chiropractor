const { getDb } = require('../config/index.js');

const createRecovery = async (record) => {
  const db = getDb();
  const [row] = await db
    .insertInto('recovery_responses')
    .values(record)
    .returningAll()
    .execute();
  return row;
};

const listRecoveries = async (userId) => {
  const db = getDb();
  return db
    .selectFrom('recovery_responses')
    .selectAll()
    .where('user_id', '=', userId)
    .execute();
};

const getRecoveryById = async (userId, id) => {
  const db = getDb();
  return db
    .selectFrom('recovery_responses')
    .selectAll()
    .where('user_id', '=', userId)
    .where('id', '=', id)
    .executeTakeFirst();
};

const updateRecovery = async (userId, id, record) => {
  const db = getDb();
  const { updated_at, ...rest } = record;
  const [row] = await db
    .updateTable('recovery_responses')
    .set(rest)
    .where('user_id', '=', userId)
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

const deleteRecovery = async (userId, id) => {
  const db = getDb();
  const [row] = await db
    .deleteFrom('recovery_responses')
    .where('user_id', '=', userId)
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

module.exports = {
  createRecovery,
  listRecoveries,
  getRecoveryById,
  updateRecovery,
  deleteRecovery,
};
