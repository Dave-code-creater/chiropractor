const { Pool } = require('pg');
const config = require('./index');
const { info, error: logError, debug, warn } = require('../utils/logger');

// PostgreSQL connection
let pgPool;

async function connectPostgreSQL() {
  try {
    pgPool = new Pool({
      user: config.databases.postgresql.user,
      password: config.databases.postgresql.password,
      host: config.databases.postgresql.host,
      port: config.databases.postgresql.port,
      database: config.databases.postgresql.database,
      ssl: config.databases.postgresql.ssl,
      max: config.databases.postgresql.max,
      min: config.databases.postgresql.min,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Test connection
    const client = await pgPool.connect();
    info(' PostgreSQL connected successfully');
    client.release();
    
    return pgPool;
  } catch (error) {
    logError(' PostgreSQL connection failed:', error);
    throw error;
  }
}

function getPostgreSQLPool() {
  if (!pgPool) {
    throw new Error('PostgreSQL pool not initialized. Call connectPostgreSQL() first.');
  }
  return pgPool;
}

module.exports = {
  connectPostgreSQL,
  getPostgreSQLPool
}; 