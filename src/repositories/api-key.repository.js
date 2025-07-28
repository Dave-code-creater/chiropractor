const BaseRepository = require('./base.repository');
const bcrypt = require('bcryptjs');
const { database, error: logError, info, debug } = require('../utils/logger');

/**
 * API Key Repository Class
 * Handles database operations for api_keys table
 */
class ApiKeyRepository extends BaseRepository {
  constructor() {
    super('api_keys');
  }

  /**
   * Create a new API key
   * @param {Object} keyData - API key data
   * @returns {Object} Created API key record
   */
  async createApiKey(keyData) {
    const {
      user_id,
      key,
      is_refresh_token = false,
      status = true,
      permission_code = '0000',
      device_id,
      device_type,
      platform,
      browser,
      expires_at
    } = keyData;

    // Store JWT tokens directly (they are already secure)
    // Only hash if it's a custom API key (not a JWT token)
    const isJWT = key && key.includes('.');
    const storedKey = isJWT ? key : await bcrypt.hash(key, 8);

    const data = {
      user_id,
      key: storedKey,
      is_refresh_token,
      status,
      permission_code,
      device_id,
      device_type,
      platform,
      browser,
      expires_at,
      created_at: new Date()
    };

    return await this.create(data);
  }

  /**
   * Find API keys by user ID
   * @param {number} userId - User ID
   * @param {boolean} activeOnly - Only return active keys
   * @returns {Array} API key records
   */
  async findByUserId(userId, activeOnly = true) {
    const conditions = { user_id: userId };
    if (activeOnly) {
      conditions.status = true;
    }

    return await this.findBy(conditions, '*', { orderBy: 'created_at DESC' });
  }

  /**
   * Find active API key by user ID and key
   * @param {number} userId - User ID
   * @param {string} key - API key to verify
   * @returns {Object|null} API key record or null
   */
  async findActiveKeyByUserId(userId, key) {
    const keys = await this.findByUserId(userId, true);

    for (const keyRecord of keys) {
      const isValid = await bcrypt.compare(key, keyRecord.key);
      if (isValid && this.isKeyValid(keyRecord)) {
        return keyRecord;
      }
    }

    return null;
  }

  /**
   * Find API key by key value (used by auth middleware)
   * @param {string} key - API key to find
   * @returns {Object|null} API key record or null
   */
  async findByKey(key) {
    try {
      // Get all active keys and check each one
      const query = `
        SELECT * FROM ${this.tableName}
        WHERE status = true
        ORDER BY created_at DESC
      `;

      const result = await this.query(query);
      const keys = result.rows;

      for (const keyRecord of keys) {
        // Check if it's a direct match (for JWT tokens)
        if (keyRecord.key === key && this.isKeyValid(keyRecord)) {
          return keyRecord;
        }

        // Check if it's a hashed match (for custom API keys)
        const isHashedMatch = await bcrypt.compare(key, keyRecord.key);
        if (isHashedMatch && this.isKeyValid(keyRecord)) {
          return keyRecord;
        }
      }

      return null;
    } catch (error) {
      database.error('Error finding API key:', error);
      return null;
    }
  }

  /**
   * Update API key last used information
   * @param {number} keyId - API key ID
   * @param {Object} usageInfo - Usage information
   * @returns {Object|null} Updated API key record
   */
  async updateLastUsed(keyId, usageInfo = {}) {
    const {
      last_used_ip,
      last_used_user_agent
    } = usageInfo;

    return await this.updateById(keyId, {
      last_used: new Date(),
      last_used_ip,
      last_used_user_agent
    });
  }

  /**
   * Deactivate API key
   * @param {number} keyId - API key ID
   * @returns {Object|null} Updated API key record
   */
  async deactivateKey(keyId) {
    return await this.updateById(keyId, { status: false });
  }

  /**
   * Deactivate all API keys for a user
   * @param {number} userId - User ID
   * @returns {Array} Updated API key records
   */
  async deactivateAllUserKeys(userId) {
    return await this.updateBy({ user_id: userId }, { status: false });
  }

  /**
   * Clean up expired API keys
   * @returns {number} Number of deleted keys
   */
  async cleanupExpiredKeys() {
    const conditions = {
      expires_at: { operator: '<', value: new Date() }
    };

    return await this.deleteBy(conditions);
  }

  /**
   * Get API key statistics for a user
   * @param {number} userId - User ID
   * @returns {Object} API key statistics
   */
  async getUserKeyStats(userId) {
    const query = `
      SELECT 
        COUNT(*) as total_keys,
        COUNT(CASE WHEN status = true THEN 1 END) as active_keys,
        COUNT(CASE WHEN status = false THEN 1 END) as inactive_keys,
        COUNT(CASE WHEN is_refresh_token = true THEN 1 END) as refresh_tokens,
        COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_keys,
        MAX(last_used) as last_key_used,
        MIN(created_at) as first_key_created
      FROM ${this.tableName}
      WHERE user_id = $1
    `;

    const result = await this.query(query, [userId]);
    return result.rows[0];
  }

  /**
   * Get device statistics for a user
   * @param {number} userId - User ID
   * @returns {Array} Device usage statistics
   */
  async getUserDeviceStats(userId) {
    const query = `
      SELECT 
        device_type,
        platform,
        browser,
        COUNT(*) as key_count,
        MAX(last_used) as last_used,
        MAX(created_at) as last_created
      FROM ${this.tableName}
      WHERE user_id = $1 AND device_type IS NOT NULL
      GROUP BY device_type, platform, browser
      ORDER BY last_used DESC NULLS LAST, last_created DESC
    `;

    const result = await this.query(query, [userId]);
    return result.rows;
  }

  /**
   * Check if API key is valid (not expired and active)
   * @param {Object} keyRecord - API key record
   * @returns {boolean} True if key is valid
   */
  isKeyValid(keyRecord) {
    if (!keyRecord.status) {
      return false;
    }

    if (keyRecord.expires_at && new Date(keyRecord.expires_at) < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Get refresh tokens for a user
   * @param {number} userId - User ID
   * @returns {Array} Refresh token records
   */
  async getRefreshTokens(userId) {
    return await this.findBy({
      user_id: userId,
      is_refresh_token: true,
      status: true
    }, '*', { orderBy: 'created_at DESC' });
  }

  /**
   * Revoke refresh token
   * @param {number} userId - User ID
   * @param {string} token - Refresh token to revoke
   * @returns {boolean} True if token was revoked
   */
  async revokeRefreshToken(userId, token) {
    const refreshTokens = await this.getRefreshTokens(userId);

    for (const tokenRecord of refreshTokens) {
      const isValid = await bcrypt.compare(token, tokenRecord.key);
      if (isValid) {
        await this.deactivateKey(tokenRecord.id);
        return true;
      }
    }

    return false;
  }

  /**
   * Get API keys that are about to expire
   * @param {number} hours - Hours before expiration to check
   * @returns {Array} API keys expiring soon
   */
  async getKeysExpiringIn(hours = 24) {
    const expirationTime = new Date();
    expirationTime.setHours(expirationTime.getHours() + hours);

    const query = `
      SELECT ak.*, u.email, u.username
      FROM ${this.tableName} ak
      JOIN users u ON ak.user_id = u.id
      WHERE ak.status = true 
        AND ak.expires_at IS NOT NULL
        AND ak.expires_at BETWEEN NOW() AND $1
      ORDER BY ak.expires_at ASC
    `;

    const result = await this.query(query, [expirationTime]);
    return result.rows;
  }

  /**
   * Get global API key statistics
   * @returns {Object} Global API key statistics
   */
  async getGlobalStats() {
    const query = `
      SELECT 
        COUNT(*) as total_keys,
        COUNT(CASE WHEN status = true THEN 1 END) as active_keys,
        COUNT(CASE WHEN status = false THEN 1 END) as inactive_keys,
        COUNT(CASE WHEN is_refresh_token = true THEN 1 END) as refresh_tokens,
        COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired_keys,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT device_type) as unique_device_types,
        AVG(EXTRACT(EPOCH FROM (expires_at - created_at))/3600) as avg_expiry_hours
      FROM ${this.tableName}
    `;

    const result = await this.query(query);
    return result.rows[0];
  }
}

module.exports = ApiKeyRepository; 