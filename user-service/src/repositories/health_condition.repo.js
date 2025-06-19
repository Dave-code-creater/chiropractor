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
const listHealthConditionsByUser = async (userId) => {
    const db = getDb();
    return db
        .selectFrom('health_conditions')
        .selectAll()
        .where('user_id', '=', userId)
        .execute();
};

const getHealthConditionById = async (id) => {
    const db = getDb();
    return db
        .selectFrom('health_conditions')
        .selectAll()
        .where('id', '=', id)
        .executeTakeFirst();
};
const updateHealthCondition = async (id, userId, condition) => {
    const db = getDb();
    const { updated_at, ...rest } = condition;
    const [row] = await db
        .updateTable('health_conditions')
        .set(rest)
        .where('id', '=', id)
        .where('user_id', '=', userId)
        .returningAll()
        .execute();
    return row;
};

const deleteHealthCondition = async (id, userId) => {
    const db = getDb();
    const [row] = await db
        .deleteFrom('health_conditions')
        .where('id', '=', id)
        .where('user_id', '=', userId)
        .returningAll()
        .execute();
    return row;
};
module.exports = {
    createHealthCondition,
    listHealthConditionsByUser,
    getHealthConditionById,
    updateHealthCondition,
    deleteHealthCondition,
};
