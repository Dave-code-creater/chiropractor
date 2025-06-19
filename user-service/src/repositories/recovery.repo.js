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

const getRecoveryById = async (userId, reportId) => {
  const db = getDb();
  return db
    .selectFrom('recovery_responses')
    .selectAll()
    .where('user_id', '=', userId)
    .where('report_id', '=', reportId)
    .executeTakeFirst();
};

const updateRecovery = async (userId, reportId, record) => {
  const db = getDb();
  const { updated_at, ...rest } = record;
  const [row] = await db
    .updateTable('recovery_responses')
    .set(rest)
    .where('user_id', '=', userId)
    .where('report_id', '=', reportId)
    .returningAll()
    .execute();
  return row;
};

const deleteRecovery = async (userId, reportId) => {
  const db = getDb();
  const [row] = await db
    .deleteFrom('recovery_responses')
    .where('user_id', '=', userId)
    .where('report_id', '=', reportId)
    .returningAll()
    .execute();
  return row;
};

module.exports = {
  createRecovery,
  getRecoveryById,
  updateRecovery,
  deleteRecovery,
};
