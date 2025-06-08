import { getDb } from '../config/index.js';

export const createReport = async (ownerId, data) => {
  const db = getDb();
  const [row] = await db
    .insertInto('reports')
    .values({ owner_id: ownerId, data })
    .returningAll()
    .execute();
  return row;
};

export const getReportById = async (id) => {
  const db = getDb();
  return db
    .selectFrom('reports')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

export const updateReport = async (id, data) => {
  const db = getDb();
  const [row] = await db
    .updateTable('reports')
    .set({ data, updated_at: db.fn.now() })
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

export const listReports = async () => {
  const db = getDb();
  return db.selectFrom('reports').selectAll().execute();
};
