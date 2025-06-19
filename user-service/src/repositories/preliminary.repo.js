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

const listPreliminariesByUser = async (userId) => {
    const db = getDb();
    return db
        .selectFrom('patient_intake_responses')
        .selectAll()
        .where('user_id', '=', userId)
        .execute();
};

const getPreliminaryById = async (id) => {
    const db = getDb();
    return db
        .selectFrom('patient_intake_responses')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
};
const updatePreliminary = async (id, userId, preliminary) => {
    const db = getDb();
    const [row] = await db
        .updateTable('patient_intake_responses')
        .set(preliminary)
        .where('id', '=', id)
        .where('user_id', '=', userId)
        .returningAll()
        .execute();
    return row;
};

const deletePreliminary = async (id, userId) => {
    const db = getDb();
    const [row] = await db
        .deleteFrom('patient_intake_responses')
        .where('id', '=', id)
        .where('user_id', '=', userId)
        .returningAll()
        .execute();
    return row;
};
module.exports = {
    createPreliminary,
    listPreliminariesByUser,
    getPreliminaryById,
    updatePreliminary,
    deletePreliminary,
};
