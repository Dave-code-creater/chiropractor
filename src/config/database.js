const { Pool } = require('pg');
const mongoose = require('mongoose');
const config = require('./index');

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
    console.log('✅ PostgreSQL connected successfully');
    client.release();
    
    return pgPool;
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    throw error;
  }
}

// MongoDB connection
async function connectMongoDB() {
  try {
    await mongoose.connect(config.databases.mongodb.uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
}

function getPostgreSQLPool() {
  if (!pgPool) {
    throw new Error('PostgreSQL pool not initialized. Call connectPostgreSQL() first.');
  }
  return pgPool;
}

function getMongooseConnection() {
  return mongoose.connection;
}

module.exports = {
  connectPostgreSQL,
  connectMongoDB,
  getPostgreSQLPool,
  getMongooseConnection
}; 