const { getPostgreSQLPool } = require('../config/database');

/**
 * Base Repository Class
 * Provides common database operations and connection management
 */
class BaseRepository {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = null;
  }

  /**
   * Get database connection pool
   * @returns {Pool} PostgreSQL connection pool
   */
  getPool() {
    if (!this.pool) {
      this.pool = getPostgreSQLPool();
    }
    return this.pool;
  }

  /**
   * Get a database client from the pool
   * @returns {PoolClient} Database client
   */
  async getClient() {
    const pool = this.getPool();
    if (!pool) {
      throw new Error('Database connection not available');
    }
    return await pool.connect();
  }

  /**
   * Execute a query with automatic client management
   * @param {string} query - SQL query
   * @param {Array} params - Query parameters
   * @returns {Object} Query result
   */
  async query(query, params = []) {
    const client = await this.getClient();
    try {
      return await client.query(query, params);
    } finally {
      client.release();
    }
  }

  /**
   * Execute multiple queries in a transaction
   * @param {Function} callback - Function that receives client and executes queries
   * @returns {*} Result from callback
   */
  async transaction(callback) {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Find a single record by ID
   * @param {number} id - Record ID
   * @param {string} columns - Columns to select (default: *)
   * @returns {Object|null} Found record or null
   */
  async findById(id, columns = '*') {
    const query = `SELECT ${columns} FROM ${this.tableName} WHERE id = $1`;
    const result = await this.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find records by condition
   * @param {Object} conditions - Where conditions
   * @param {string} columns - Columns to select (default: *)
   * @param {Object} options - Query options (limit, offset, orderBy)
   * @returns {Array} Found records
   */
  async findBy(conditions = {}, columns = '*', options = {}) {
    const whereClause = this.buildWhereClause(conditions);
    const orderClause = options.orderBy ? `ORDER BY ${options.orderBy}` : '';
    const limitClause = options.limit ? `LIMIT ${options.limit}` : '';
    const offsetClause = options.offset ? `OFFSET ${options.offset}` : '';
    
    const query = `
      SELECT ${columns} 
      FROM ${this.tableName} 
      ${whereClause.clause}
      ${orderClause}
      ${limitClause}
      ${offsetClause}
    `.trim();

    const result = await this.query(query, whereClause.params);
    return result.rows;
  }

  /**
   * Find a single record by condition
   * @param {Object} conditions - Where conditions
   * @param {string} columns - Columns to select (default: *)
   * @returns {Object|null} Found record or null
   */
  async findOne(conditions, columns = '*') {
    const records = await this.findBy(conditions, columns, { limit: 1 });
    return records[0] || null;
  }

  /**
   * Create a new record
   * @param {Object} data - Record data
   * @returns {Object} Created record
   */
  async create(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`);

    const query = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders.join(', ')})
      RETURNING *
    `;

    const result = await this.query(query, values);
    return result.rows[0];
  }

  /**
   * Update a record by ID
   * @param {number} id - Record ID
   * @param {Object} data - Updated data
   * @returns {Object|null} Updated record or null
   */
  async updateById(id, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, index) => `${col} = $${index + 2}`).join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await this.query(query, [id, ...values]);
    return result.rows[0] || null;
  }

  /**
   * Update records by condition
   * @param {Object} conditions - Where conditions
   * @param {Object} data - Updated data
   * @returns {Array} Updated records
   */
  async updateBy(conditions, data) {
    const whereClause = this.buildWhereClause(conditions);
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, index) => `${col} = $${whereClause.params.length + index + 1}`).join(', ');

    const query = `
      UPDATE ${this.tableName}
      SET ${setClause}, updated_at = NOW()
      ${whereClause.clause}
      RETURNING *
    `;

    const result = await this.query(query, [...whereClause.params, ...values]);
    return result.rows;
  }

  /**
   * Delete a record by ID
   * @param {number} id - Record ID
   * @returns {boolean} True if deleted, false if not found
   */
  async deleteById(id) {
    const query = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING id`;
    const result = await this.query(query, [id]);
    return result.rows.length > 0;
  }

  /**
   * Delete records by condition
   * @param {Object} conditions - Where conditions
   * @returns {number} Number of deleted records
   */
  async deleteBy(conditions) {
    const whereClause = this.buildWhereClause(conditions);
    const query = `DELETE FROM ${this.tableName} ${whereClause.clause} RETURNING id`;
    const result = await this.query(query, whereClause.params);
    return result.rows.length;
  }

  /**
   * Count records by condition
   * @param {Object} conditions - Where conditions
   * @returns {number} Record count
   */
  async count(conditions = {}) {
    const whereClause = this.buildWhereClause(conditions);
    const query = `SELECT COUNT(*) as count FROM ${this.tableName} ${whereClause.clause}`;
    const result = await this.query(query, whereClause.params);
    return parseInt(result.rows[0].count);
  }

  /**
   * Check if a record exists
   * @param {Object} conditions - Where conditions
   * @returns {boolean} True if exists, false otherwise
   */
  async exists(conditions) {
    const count = await this.count(conditions);
    return count > 0;
  }

  /**
   * Build WHERE clause from conditions object
   * @param {Object} conditions - Conditions object
   * @returns {Object} Object with clause string and parameters array
   */
  buildWhereClause(conditions) {
    const keys = Object.keys(conditions);
    
    if (keys.length === 0) {
      return { clause: '', params: [] };
    }

    const clauses = [];
    const params = [];
    let paramIndex = 1;

    keys.forEach(key => {
      const value = conditions[key];
      
      if (value === null || value === undefined) {
        clauses.push(`${key} IS NULL`);
      } else if (Array.isArray(value)) {
        const placeholders = value.map(() => `$${paramIndex++}`);
        clauses.push(`${key} IN (${placeholders.join(', ')})`);
        params.push(...value);
      } else if (typeof value === 'object' && value.operator) {
        // Support for operators like { operator: '>=', value: 18 }
        clauses.push(`${key} ${value.operator} $${paramIndex++}`);
        params.push(value.value);
      } else {
        clauses.push(`${key} = $${paramIndex++}`);
        params.push(value);
      }
    });

    return {
      clause: `WHERE ${clauses.join(' AND ')}`,
      params
    };
  }

  /**
   * Get all records with pagination
   * @param {Object} options - Query options
   * @returns {Object} Records and pagination info
   */
  async paginate(options = {}) {
    const {
      page = 1,
      limit = 10,
      conditions = {},
      columns = '*',
      orderBy = 'id ASC'
    } = options;

    const offset = (page - 1) * limit;
    const totalCount = await this.count(conditions);
    const records = await this.findBy(conditions, columns, { 
      limit, 
      offset, 
      orderBy 
    });

    return {
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    };
  }
}

module.exports = BaseRepository; 