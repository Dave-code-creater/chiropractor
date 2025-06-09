const { getDb } = require('../config/index.js');

const createProfile = async (profile) => {
  const db = getDb();
  const [row] = await db
    .insertInto('user_profile')
    .values(profile)
    .returningAll()
    .execute();
  return row;
};

const getProfileById = async (id) => {
  const db = getDb();
  return db
    .selectFrom('user_profile')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

const updateProfile = async (id, profile) => {
  const db = getDb();
  const { updated_at, ...rest } = profile;
  const [row] = await db
    .updateTable('user_profile')
    .set(profile)
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

module.exports = {
  createProfile,
  getProfileById,
  updateProfile,
};
