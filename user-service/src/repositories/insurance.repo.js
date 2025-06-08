import { getDb } from '../config/index.js';

export const createInsuranceDetail = async (detail) => {
  const db = getDb();
  const [row] = await db
    .insertInto('insurance_details')
    .values(detail)
    .returningAll()
    .execute();
  return row;
};

export const getInsuranceDetailById = async (id) => {
  const db = getDb();
  return db
    .selectFrom('insurance_details')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

export const updateInsuranceDetail = async (id, detail) => {
  const db = getDb();
  const [row] = await db
    .updateTable('insurance_details')
    .set(detail)
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};
