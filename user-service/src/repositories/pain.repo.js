const { getDb } = require('../config/index.js');

const createPainDescription = async (desc) => {
  const db = getDb();
  const [row] = await db
    .insertInto('pain_descriptions')
    .values(desc)
    .returningAll()
    .execute();
  return row;
};

const listPainDescriptionsByUser = async (userId) => {
  const db = getDb();
  return db
    .selectFrom('pain_descriptions')
    .selectAll()
    .where('user_id', '=', userId)
    .execute();
};

const getPainDescriptionById = async (id) => {
  const db = getDb();
  return db
    .selectFrom('pain_descriptions')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

const updatePainDescription = async (id, userId, desc) => {
  const db = getDb();
  const { updated_at, ...rest } = desc;
  const [row] = await db
    .updateTable('pain_descriptions')
    .set(rest)
    .where('id', '=', id)
    .where('user_id', '=', userId)
    .returningAll()
    .execute();
  return row;
};

const deletePainDescription = async (id, userId) => {
  const db = getDb();
  const [row] = await db
    .deleteFrom('pain_descriptions')
    .where('id', '=', id)
    .where('user_id', '=', userId)
    .returningAll()
    .execute();
  return row;
};


module.exports = {
  createPainDescription,
  listPainDescriptionsByUser,
  getPainDescriptionById,
  updatePainDescription,
  deletePainDescription,
};
