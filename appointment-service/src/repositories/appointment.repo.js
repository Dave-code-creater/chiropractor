import { getDb } from '../config/index.js';

export const createAppointment = async (appt) => {
  const db = getDb();
  const [row] = await db
    .insertInto('appointments')
    .values(appt)
    .returningAll()
    .execute();
  return row;
};

export const getAppointmentById = async (id) => {
  const db = getDb();
  return db
    .selectFrom('appointments')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

export const updateAppointment = async (id, appt) => {
  const db = getDb();
  const [row] = await db
    .updateTable('appointments')
    .set(appt)
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

export const listAppointments = async () => {
  const db = getDb();
  return db.selectFrom('appointments').selectAll().execute();
};
