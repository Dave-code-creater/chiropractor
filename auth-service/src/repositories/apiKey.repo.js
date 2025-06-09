const { getDb } = require('../config/index.js');

const insertApiKey = async ({
    userId,
    keyHash,
    is_refresh_token = false,
    expires_at = null,
    permission_code = '0000',
    status = true,
    device_id = null,
    device_type = null,
    platform = null,
    browser = null,
    last_used = null,
    last_used_ip = null,
    last_used_user_agent = null
}) => {
    const db = getDb();
    const [row] = await db
        .insertInto('api_keys')
        .values({
            user_id: userId,
            key: keyHash,
            is_refresh_token,
            expires_at,
            permission_code,
            status,
            device_id,
            device_type,
            platform,
            browser,
            last_used,
            last_used_ip,
            last_used_user_agent,
            created_at: new Date(),
        })
        .returningAll()
        .execute();
    return row;
};

const findApiKeyByUser = async (key) => {
    const db = getDb();
    return db
        .selectFrom('api_keys')
        .selectAll()
        .where('key', '=', key)
        .orderBy('created_at', 'desc')
        .limit(1)
        .executeTakeFirst();
};

const deleteApiKeyByKey = async (key) => {
    const db = getDb();
    await db
        .updateTable('api_keys')
        .set({ status: false })
        .where('key', '=', key)
        .execute();
};

module.exports = {
    insertApiKey,
    findApiKeyByUser,
    deleteApiKeyByKey,
};