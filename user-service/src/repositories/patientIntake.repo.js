const { getDb } = require('../config/index.js');

const createPatientIntake = async (userId, data) => {
  const db = getDb();
  const [row] = await db
    .insertInto('patient_intake_responses')
    .values({ user_id: userId, data })
    .returningAll()
    .execute();
  return row;
};

const getPatientIntakeById = async (userId) => {
  const db = getDb();
  return db
    .selectFrom('patient_intake_responses')
    .selectAll()
    .where('user_id', '=', userId)
    .executeTakeFirst();
};

const updatePatientIntake = async (userId, data) => {
  const db = getDb();
  const [row] = await db
    .updateTable('patient_intake_responses')
    .set({ data, updated_at: new Date() })
    .where('user_id', '=', userId)
    .returningAll()
    .execute();
  return row;
};

module.exports = {
  createPatientIntake,
  getPatientIntakeById,
  updatePatientIntake,
};
