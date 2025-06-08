import { getDb } from '../config/index.js';

export const createUser = async (username, passwordHash) => {
  const db = getDb();
  const [user] = await db
    .insertInto('user_identity')
    .values({ username, password_hash: passwordHash })
    .returning(['id', 'username'])
    .execute();
  return user;
};

export const findUserByUsername = async (username) => {
  const db = getDb();
  return db
    .selectFrom('user_identity')
    .selectAll()
    .where('username', '=', username)
    .executeTakeFirst();
};
