import dotenv from 'dotenv';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

let db;

export const loadEnv = () => {
  dotenv.config();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = new Kysely({ dialect: new PostgresDialect({ pool }) });
};

export const getDb = () => db;
