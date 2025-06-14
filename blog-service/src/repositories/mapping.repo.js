const { getPgDb } = require('../config/index.js');

const savePostMapping = async (mapping) => {
  const db = getPgDb();
  const [row] = await db
    .insertInto('blog_posts')
    .values(mapping)
    .returningAll()
    .execute();
  return row;
};

const getMappingsByUserId = async (userId) => {
  const db = getPgDb();
  return db
    .selectFrom('blog_posts')
    .selectAll()
    .where('user_id', '=', userId)
    .execute();
};

const updateMapping = async (mongoId, mapping) => {
  const db = getPgDb();
  const [row] = await db
    .updateTable('blog_posts')
    .set(mapping)
    .where('mongo_id', '=', mongoId)
    .returningAll()
    .execute();
  return row;
};

const deleteMapping = async (mongoId) => {
  const db = getPgDb();
  await db.deleteFrom('blog_posts').where('mongo_id', '=', mongoId).execute();
};

module.exports = {
  savePostMapping,
  getMappingsByUserId,
  updateMapping,
  deleteMapping,
};
