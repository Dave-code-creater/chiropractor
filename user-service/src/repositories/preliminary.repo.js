const { getDb } = require('../config/index.js');

const createPreliminary = async (preliminary) => {
    const db = getDb();
    const [row] = await db
        .insertInto('patient_intake_responses')
        .values(preliminary)
        .returningAll()
        .execute();
    return row;
}

const getPreliminaryById = async (userId) => {
    const db = getDb();
    return db
        .selectFrom('patient_intake_responses')
        .selectAll()
        .where('user_id', '=', userId)
        .executeTakeFirst();
};
const updatePreliminary = async (userId, preliminary) => {
    const db = getDb();
    const [row] = await db
        .updateTable('patient_intake_responses')
        .set(preliminary)
        .where('user_id', '=', userId)
        .returningAll()
        .execute();
    return row;
};

const deletePreliminary = async (userId) => {
    const db = getDb();
    const [row] = await db
        .deleteFrom('patient_intake_responses')
        .where('user_id', '=', userId)
        .returningAll()
        .execute();
    return row;
};
module.exports = {
    createPreliminary,
    getPreliminaryById,
    updatePreliminary,
    deletePreliminary,
};
