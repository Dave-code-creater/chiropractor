import { getDb } from '../config/index.js';

export const getApi = async (apiId) => {
    const db = getDb();
    return db
        .selectFrom('apis')
        .selectAll()
        .where('id', '=', apiId)
        .executeTakeFirst();
}

export async function insertApiKey({ userId, keyHash }) {
    const db = getDb();
    const [row] = await db
        .insertInto('api_keys')
        .values({
            user_id: userId,
            key: keyHash,
            created_at: new Date(),
        })
        .returningAll()
        .execute();
    return row;
}

/** fetch the latest key for a user (if any) */
export async function findApiKeyByUser(userId) {
    const db = getDb();
    return db
        .selectFrom('api_keys')
        .selectAll()
        .where('user_id', '=', userId)
        .orderBy('created_at', 'desc')
        .limit(1)
        .executeTakeFirst();
}
