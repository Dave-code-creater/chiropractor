const { getDb } = require('../config/index.js');

const createUser = async (user) => {
  const db = getDb();
  const [row] = await db
    .insertInto('users')
    .values(user).returning(['id'])
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

const findUserByEmailAndPhone = async (email, phone) => {
  const db = getDb();
  return db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
    .where('phone_number', '=', phone)
    .executeTakeFirst();
};

const updateUserPassword = async (id, passwordHash) => {
  const db = getDb();
  const [row] = await db
    .updateTable('users')
    .set({ password_hash: passwordHash, updated_at: db.fn.now() })
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

const updateUser = async (id, data) => {
  const db = getDb();
  const [row] = await db
    .updateTable('users')
    .set({ ...data, updated_at: db.fn.now() })
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

const deleteUser = async (id) => {
  const db = getDb();
  const [row] = await db
    .deleteFrom('users')
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

const listUsers = async () => {
  const db = getDb();
  return db.selectFrom('users').selectAll().execute();
};


module.exports = {
  createUser,
  findUserByEmail,
  findUserByUsername,
  findUserById,
  findUserByRole,
  findUserByEmailAndPhone,
  updateUserPassword,
  updateUser,
  deleteUser,
  listUsers,
};

