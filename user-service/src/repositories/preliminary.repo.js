const { getDb } = require('../db');

const createPreliminary = async (preliminary) => {
    const db = getDb();
    const [row] = await db
        .insertInto('preliminaries')
        .values(preliminary)
        .returningAll()
        .execute();
    return row;
}

const getPreliminaryById = async (userId) => {
    const db = getDb();
    return db
        .selectFrom('preliminaries')
        .selectAll()
        .where('user_id', '=', userId)
        .executeTakeFirst();
};
const updatePreliminary = async (userId, preliminary) => {
    const db = getDb();
    const { updated_at, ...rest } = preliminary;
    const [row] = await db
        .updateTable('preliminaries')
        .set(rest)
        .where('user_id', '=', userId)
        .returningAll()
        .execute();
    return row;
};
module.exports = {
    createPreliminary,
    getPreliminaryById,
    updatePreliminary
};