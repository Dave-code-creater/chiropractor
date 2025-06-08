import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { Pool } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsDir = path.join(__dirname, '..', 'migrations');

async function run() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
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
