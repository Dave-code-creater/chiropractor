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

const listDetailsDescriptionsByUser = async (userId) => {
    const db = getDb();
    return db
        .selectFrom('details_descriptions')
        .selectAll()
        .where('user_id', '=', userId)
        .execute();
};

const getDetailsDescriptionById = async (id) => {
    const db = getDb();
    return db
        .selectFrom('details_descriptions')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
};

const updateDetailsDescription = async (id, userId, description) => {
  const db = getDb();
  const { updated_at, ...rest } = description;
  const [row] = await db
    .updateTable('details_descriptions')
    .set(rest)
    .where('id', '=', id)
    .where('user_id', '=', userId)
    .returningAll()
    .execute();
  return row;
};

const deleteDetailsDescription = async (id, userId) => {
  const db = getDb();
  const [row] = await db
    .deleteFrom('details_descriptions')
    .where('id', '=', id)
    .where('user_id', '=', userId)
    .returningAll()
    .execute();
  return row;
};

module.exports = {
    createDetailsDescription,
    listDetailsDescriptionsByUser,
    getDetailsDescriptionById,
    updateDetailsDescription,
    deleteDetailsDescription,
};
