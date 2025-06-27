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

const listAppointmentsByPatient = async (userId) => {
  const db = getDb();
  return db
    .selectFrom('appointments')
    .selectAll()
    .where('user_id', '=', userId)
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

const rescheduleAppointment = async (id, rescheduleData) => {
  const db = getDb();
  
  // First get the current appointment to preserve original_scheduled_at
  const currentAppt = await db
    .selectFrom('appointments')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
    
  if (!currentAppt) return null;
  
  const updateData = {
    scheduled_at: rescheduleData.scheduled_at,
    date: rescheduleData.date,
    time: rescheduleData.time,
    reschedule_reason: rescheduleData.reschedule_reason,
    reschedule_count: currentAppt.reschedule_count + 1,
    original_scheduled_at: currentAppt.original_scheduled_at || currentAppt.scheduled_at,
    updated_at: new Date().toISOString()
  };
  
  const [row] = await db
    .updateTable('appointments')
    .set(updateData)
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
  rescheduleAppointment,
};
