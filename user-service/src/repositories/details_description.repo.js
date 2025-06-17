const { getDb } = require('../config/index.js');

const createDetailsDescription = async (description) => {
    const db = getDb();
    const [row] = await db
        .insertInto('details_descriptions')
        .values(description)
        .returningAll()
        .execute();
    return row;
}

const getDetailsDescriptionById = async (userId) => {
    const db = getDb();
    return db
        .selectFrom('details_descriptions')
        .selectAll()
        .where('user_id', '=', userId)
        .executeTakeFirst();
}

const updateDetailsDescription = async (userId, description) => {
  const db = getDb();
  const { updated_at, ...rest } = description;
  const [row] = await db
    .updateTable('details_descriptions')
    .set(rest)
    .where('user_id', '=', userId)
    .returningAll()
    .execute();
  return row;
};

const deleteDetailsDescription = async (userId) => {
  const db = getDb();
  const [row] = await db
    .deleteFrom('details_descriptions')
    .where('user_id', '=', userId)
    .returningAll()
    .execute();
  return row;
};

module.exports = {
    createDetailsDescription,
    getDetailsDescriptionById,
    updateDetailsDescription,
    deleteDetailsDescription,
};