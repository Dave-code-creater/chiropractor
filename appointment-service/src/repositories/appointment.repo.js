const { getDb } = require('../config/index.js');

const createAppointment = async (appt) => {
  const db = getDb();
  const [row] = await db
    .insertInto('appointments')
    .values(appt)
    .returningAll()
    .execute();
  return row;
};

const getAppointmentById = async (id) => {
  const db = getDb();
  return db
    .selectFrom('appointments')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

const updateAppointment = async (id, appt) => {
  const db = getDb();
  const [row] = await db
    .updateTable('appointments')
    .set(appt)
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

const listAppointments = async () => {
  const db = getDb();
  return db.selectFrom('appointments').selectAll().execute();
};

const listAppointmentsByPatient = async (patientId) => {
  const db = getDb();
  return db
    .selectFrom('appointments')
    .selectAll()
    .where('patient_id', '=', patientId)
    .execute();
};

const listAppointmentsByDoctor = async (doctorId) => {
  const db = getDb();
  return db
    .selectFrom('appointments')
    .selectAll()
    .where('doctor_id', '=', doctorId)
    .execute();
};

const deleteAppointment = async (id) => {
  const db = getDb();
  const [row] = await db
    .deleteFrom('appointments')
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

module.exports = {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  listAppointments,
  listAppointmentsByPatient,
  listAppointmentsByDoctor,
  deleteAppointment,
};
