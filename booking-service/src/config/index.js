const dotenv = require('dotenv');
const { Pool } = require('pg');
const { Kysely, PostgresDialect } = require('kysely');

let db;

const loadEnv = () => {
  dotenv.config();
  const url =
    process.env.DATABASE_URL ||
    `postgres://${process.env.PRO_POSTGRESQL_USER}:${process.env.PRO_POSTGRESQL_PASS}@${process.env.PRO_POSTGRESQL_HOST}:${process.env.PRO_POSTGRESQL_PORT}/${process.env.PRO_POSTGRESQL_NAME}`;
  const pool = new Pool({ connectionString: url });
  db = new Kysely({ dialect: new PostgresDialect({ pool }) });
};

const getDb = () => db;

module.exports = { loadEnv, getDb };
