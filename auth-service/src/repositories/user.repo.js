import { getDb } from '../config/index.js';

export const createUser = async (user) => {
  const db = getDb();
  const [row] = await db
    .insertInto('users')
    .values(user)
    .returning(['id'])
    .execute();
  return row;
};

export const findUserByEmail = async (email) => {
  const db = getDb();
  return db
    .selectFrom('users')
    .selectAll()
    .where('email', '=', email)
    .executeTakeFirst();
};

export const findUserByUsername = async (username) => {
  const db = getDb();
  return db
    .selectFrom('users')
    .selectAll()
    .where('username', '=', username)
    .executeTakeFirst();
}
