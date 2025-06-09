const { getDb } = require('../config/index.js');

const createReport = async (ownerId, data) => {
  const db = getDb();
  const [row] = await db
    .insertInto('reports')
    .values({ owner_id: ownerId, data })
    .returningAll()
    .execute();
  return row;
};

const getReportById = async (id) => {
  const db = getDb();
  return db
    .selectFrom('reports')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

const updateReport = async (id, data) => {
  const db = getDb();
  const [row] = await db
    .updateTable('reports')
    .set({ data, updated_at: db.fn.now() })
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

const listReports = async () => {
  const db = getDb();
  return db.selectFrom('reports').selectAll().execute();
};

module.exports = {
  createReport,
  getReportById,
  updateReport,
  listReports,
};
