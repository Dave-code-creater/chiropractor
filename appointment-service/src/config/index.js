const dotenv = require('dotenv');
const { Pool } = require('pg');
const { Kysely, PostgresDialect } = require('kysely');

let dbInstance;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const loadEnv = async (retries = 5) => {
  dotenv.config();
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const url =
        process.env.DATABASE_URL ||
        `postgres://${process.env.PRO_POSTGRESQL_USER}:${process.env.PRO_POSTGRESQL_PASS}@${process.env.PRO_POSTGRESQL_HOST}:${process.env.PRO_POSTGRESQL_PORT}/${process.env.PRO_POSTGRESQL_NAME}`;
      
      console.log(`🔌 Connecting to database... (Attempt ${attempt}/${retries})`);
      
      const pool = new Pool({ 
        connectionString: url,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });
      
      // Test the connection
      const client = await pool.connect();
      await client.query('SELECT NOW()');
      client.release();
      
      dbInstance = new Kysely({ 
        dialect: new PostgresDialect({ pool }),
        log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error']
      });
      
      // Test Kysely connection
      await dbInstance.selectFrom('doctors').select('id').limit(1).execute();
      
      console.log('✅ Database connected successfully');
      return dbInstance;
    } catch (error) {
      console.error(`❌ Database connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        console.error('💥 All database connection attempts failed');
        throw error;
      }
      
      // Exponential backoff: wait longer between retries
      const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.log(`⏳ Retrying in ${waitTime/1000} seconds...`);
      await sleep(waitTime);
    }
  }
};

const getDb = () => {
  if (!dbInstance) {
    throw new Error('Database not initialized. Call loadEnv() first.');
  }
  return dbInstance;
};

module.exports = { loadEnv, getDb };
