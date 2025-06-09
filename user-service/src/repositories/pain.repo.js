const { getDb } = require('../config/index.js');

const createPainDescription = async (desc) => {
  const db = getDb();
  const [row] = await db
    .insertInto('pain_descriptions')
    .values(desc)
    .returningAll()
    .execute();
  return row;
};

module.exports = { createPainDescription };
