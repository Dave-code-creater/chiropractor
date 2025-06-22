const { getDb } = require('../config/index.js');

const createPasswordReset = async (resetData) => {
  const db = getDb();
  const [reset] = await db
    .insertInto('password_resets')
    .values(resetData)
    .returningAll()
    .execute();
  return reset;
};

const findPasswordResetByToken = async (token) => {
  const db = getDb();
  return db
    .selectFrom('password_resets')
    .selectAll()
    .where('token', '=', token)
    .executeTakeFirst();
};

const deletePasswordReset = async (id) => {
  const db = getDb();
  return db
    .deleteFrom('password_resets')
    .where('id', '=', id)
    .execute();
};

const updateUser = async (id, updateData) => {
  const db = getDb();
  const [user] = await db
    .updateTable('users')
    .set(updateData)
    .where('id', '=', id)
    .returningAll()
    .execute();
  return user;
};

module.exports = { 
  createPasswordReset, 
  findPasswordResetByToken, 
  deletePasswordReset,
  updateUser 
}; 