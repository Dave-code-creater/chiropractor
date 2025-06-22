const { getDb } = require('../config/index.js');

const createUser = async (user) => {
  const db = getDb();
  const [row] = await db
    .insertInto('users')
    .values(user)
    .returningAll()
    .execute();
  return row;
};


const findUserByEmail = async (email) => {
  const db = getDb();
  return db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
};

const findUserByUsername = async (username) => {
  const db = getDb();
  return db
    .selectFrom('users')
    .selectAll()
    .where('username', '=', username)
    .executeTakeFirst();
};

const findUserById = async (id) => {
  const db = getDb();
  return db
    .selectFrom('users')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

const findUserByRole = async (role) => {
  const db = getDb();
  return db
    .selectFrom('users')
    .selectAll()
    .where('role', '=', role)
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

module.exports = { createUser, findUserByEmail, findUserByUsername, findUserById, findUserByRole, updateUser };
