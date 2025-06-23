const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');

const migrationsDir = path.join(__dirname, '..', 'migrations');

// Add delay function to wait for database readiness
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForDatabase(pool, maxRetries = 10, delayMs = 2000) {
  console.log('Waiting for database to be ready...');
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('Database is ready!');
      return;
    } catch (error) {
      console.log(`Database not ready, attempt ${i + 1}/${maxRetries}. Waiting ${delayMs}ms...`);
      await delay(delayMs);
    }
  }
  
  throw new Error('Database failed to become ready after maximum retries');
}

async function run() {
  // Initial delay before starting
  console.log('Starting migration process with initial delay...');
  await delay(3000); // 3 second initial delay
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  // Wait for database to be ready
  await waitForDatabase(pool);
  
  const client = await pool.connect();
  await client.query(`CREATE TABLE IF NOT EXISTS pgmigrations (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, run_on TIMESTAMPTZ NOT NULL)`);
  const files = (await fs.readdir(migrationsDir)).sort();
  for (const file of files) {
    const { rows } = await client.query('SELECT 1 FROM pgmigrations WHERE name=$1', [file]);
    if (rows.length) continue;
    const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
    await client.query('BEGIN');
    try {
      await client.query(sql);
      await client.query('INSERT INTO pgmigrations(name, run_on) VALUES ($1, now())', [file]);
      await client.query('COMMIT');
      console.log(`ran ${file}`);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    }
  }
  await client.release();
  await pool.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
