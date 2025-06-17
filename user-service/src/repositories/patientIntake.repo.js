const { getDb } = require('../config/index.js');

const createPatientIntake = async (intake) => {
  const db = getDb();
  const [row] = await db
    .insertInto('patient_intake_responses')
    .values(intake)
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

const updatePatientIntake = async (userId, intake) => {
  const db = getDb();
  const { updated_at, ...rest } = intake;
  const [row] = await db
    .updateTable('patient_intake_responses')
    .set(rest)
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
