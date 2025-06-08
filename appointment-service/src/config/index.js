import dotenv from 'dotenv';
import { Pool } from 'pg';
import { Kysely, PostgresDialect } from 'kysely';

let db;

export const loadEnv = () => {
  dotenv.config();
  const url =
    process.env.DATABASE_URL ||
    `postgres://${process.env.PRO_POSTGRESQL_USER}:${process.env.PRO_POSTGRESQL_PASS}@${process.env.PRO_POSTGRESQL_HOST}:${process.env.PRO_POSTGRESQL_PORT}/${process.env.PRO_POSTGRESQL_NAME}`;
  const pool = new Pool({ connectionString: url });
  db = new Kysely({ dialect: new PostgresDialect({ pool }) });
};

export const getDb = () => db;
