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

const listWorkImpacts = async (userId) => {
  const db = getDb();
  return db
    .selectFrom('work_impacts')
    .selectAll()
    .where('user_id', '=', userId)
    .execute();
};

const getWorkImpactById = async (userId, id) => {
  const db = getDb();
  return db
    .selectFrom('work_impacts')
    .selectAll()
    .where('user_id', '=', userId)
    .where('id', '=', id)
    .executeTakeFirst();
};

const updateWorkImpact = async (userId, id, record) => {
  const db = getDb();
  const { updated_at, ...rest } = record;
  const [row] = await db
    .updateTable('work_impacts')
    .set(rest)
    .where('user_id', '=', userId)
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

const deleteWorkImpact = async (userId, id) => {
  const db = getDb();
  const [row] = await db
    .deleteFrom('work_impacts')
    .where('user_id', '=', userId)
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

module.exports = {
  createWorkImpact,
  listWorkImpacts,
  getWorkImpactById,
  updateWorkImpact,
  deleteWorkImpact,
};
