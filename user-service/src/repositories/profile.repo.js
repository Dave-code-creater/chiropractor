const { getDb } = require('../config/index.js');

const createProfile = async (profile) => {
  const db = getDb();
  const [row] = await db
    .insertInto('profiles')
    .values(profile)
    .returningAll()
    .execute();
  return row;
};

const getProfileById = async (userId) => {
  const db = getDb();
  return db
    .selectFrom('profiles')
    .selectAll()
    .where('user_id', '=', userId)
    .executeTakeFirst();
};

const updateProfile = async (userId, profile) => {
  const db = getDb();
  const { updated_at, ...rest } = profile;
  const [row] = await db
    .updateTable('profiles')
    .set(rest)
    .where('user_id', '=', userId)
    .returningAll()
    .execute();
  return row;
};

const deleteProfile = async (userId) => {
  const db = getDb();
  const [row] = await db
    .deleteFrom('profiles')
    .where('user_id', '=', userId)
    .returningAll()
    .execute();
  return row;
};

module.exports = {
  createProfile,
  getProfileById,
  updateProfile,
  deleteProfile,
};
