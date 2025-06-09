const { getDb } = require('../config/index.js');

const createEmergencyContact = async (contact) => {
  const db = getDb();
  const [row] = await db
    .insertInto('emergency_contacts')
    .values(contact)
    .returningAll()
    .execute();
  return row;
};

const getEmergencyContactById = async (id) => {
  const db = getDb();
  return db
    .selectFrom('emergency_contacts')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst();
};

const updateEmergencyContact = async (id, contact) => {
  const db = getDb();
  const [row] = await db
    .updateTable('emergency_contacts')
    .set(contact)
    .where('id', '=', id)
    .returningAll()
    .execute();
  return row;
};

module.exports = {
  createEmergencyContact,
  getEmergencyContactById,
  updateEmergencyContact,
};
