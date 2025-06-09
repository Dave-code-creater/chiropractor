const { getDb } = require('../config/index.js');

const createTreatmentNote = async (note) => {
  const db = getDb();
  const [row] = await db
    .insertInto('treatment_notes')
    .values(note)
    .returningAll()
    .execute();
  return row;
};

const getTreatmentNoteById = async (id) => {
  const db = getDb();
  return db
    .selectFrom('treatment_notes')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

const updateTreatmentNote = async (id, note) => {
  const db = getDb();
  const [row] = await db
    .updateTable('treatment_notes')
    .set(note)
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

module.exports = {
  createTreatmentNote,
  getTreatmentNoteById,
  updateTreatmentNote,
};
