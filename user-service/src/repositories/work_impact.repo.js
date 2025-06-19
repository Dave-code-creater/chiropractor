const { getDb } = require('../config/index.js');

const createWorkImpact = async (record) => {
  const db = getDb();
  const [row] = await db
    .insertInto('work_impacts')
    .values(record)
    .returningAll()
    .execute();
  return row;
};

const getWorkImpactById = async (userId, reportId) => {
  const db = getDb();
  return db
    .selectFrom('work_impacts')
    .selectAll()
    .where('user_id', '=', userId)
    .where('report_id', '=', reportId)
    .executeTakeFirst();
};

const updateWorkImpact = async (userId, reportId, record) => {
  const db = getDb();
  const { updated_at, ...rest } = record;
  const [row] = await db
    .updateTable('work_impacts')
    .set(rest)
    .where('user_id', '=', userId)
    .where('report_id', '=', reportId)
    .returningAll()
    .execute();
  return row;
};

const deleteWorkImpact = async (userId, reportId) => {
  const db = getDb();
  const [row] = await db
    .deleteFrom('work_impacts')
    .where('user_id', '=', userId)
    .where('report_id', '=', reportId)
    .returningAll()
    .execute();
  return row;
};

module.exports = {
  createWorkImpact,
  getWorkImpactById,
  updateWorkImpact,
  deleteWorkImpact,
};
