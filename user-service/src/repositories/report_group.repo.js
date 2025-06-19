const { getDb } = require('../config/index.js');

const createReportGroup = async (record) => {
  const db = getDb();
  const [row] = await db
    .insertInto('report_groups')
    .values(record)
    .returningAll()
    .execute();
  return row;
};

const getReportGroupById = async (id) => {
  const db = getDb();
  return db
    .selectFrom('report_groups')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

const updateReportGroup = async (id, record) => {
  const db = getDb();
  const { updated_at, ...rest } = record;
  const [row] = await db
    .updateTable('report_groups')
    .set(rest)
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

const deleteReportGroup = async (id) => {
  const db = getDb();
  const [row] = await db
    .deleteFrom('report_groups')
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

module.exports = {
  createReportGroup,
  getReportGroupById,
  updateReportGroup,
  deleteReportGroup,
};
