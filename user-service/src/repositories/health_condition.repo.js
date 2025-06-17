const { getDb } = require('../config/index.js');
const createHealthCondition = async (condition) => {
    const db = getDb();
    const [row] = await db
        .insertInto('health_conditions')
        .values(condition)
        .returningAll()
        .execute();
    return row;
}
const getHealthConditionById = async (userId) => {
    const db = getDb();
    return db
        .selectFrom('health_conditions')
        .selectAll()
        .where('user_id', '=', userId)
        .executeTakeFirst();
};
const updateHealthCondition = async (userId, condition) => {
    const db = getDb();
    const { updated_at, ...rest } = condition;
    const [row] = await db
        .updateTable('health_conditions')
        .set(rest)
        .where('user_id', '=', userId)
        .returningAll()
        .execute();
    return row;
};

const deleteHealthCondition = async (userId) => {
    const db = getDb();
    const [row] = await db
        .deleteFrom('health_conditions')
        .where('user_id', '=', userId)
        .returningAll()
        .execute();
    return row;
};
module.exports = {
    createHealthCondition,
    getHealthConditionById,
    updateHealthCondition,
    deleteHealthCondition,
};
