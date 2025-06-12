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

const getPainDescriptionById = async (userId) => {
  const db = getDb();
  return db
    .selectFrom('pain_descriptions')
    .selectAll()
    .where('user_id', '=', userId)
    .executeTakeFirst();
};
const updatePainDescription = async (userId, desc) => {
  const db = getDb();
  const { updated_at, ...rest } = desc;
  const [row] = await db
    .updateTable('pain_descriptions')
    .set(rest)
    .where('user_id', '=', userId)
    .returningAll()
    .execute();
  return row;
};


module.exports = {
  createPainDescription,
  getPainDescriptionById,
  updatePainDescription
};
