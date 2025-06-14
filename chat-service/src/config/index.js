const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const { Pool } = require('pg');
const { Kysely, PostgresDialect } = require('kysely');

let mongoDb;
let pgDb;

const loadEnv = async () => {
  dotenv.config();
  const url =
    process.env.MONGO_URL ||
    `mongodb://${process.env.PRO_MONGODB_HOST}:${process.env.PRO_MONGODB_PORT}/${process.env.PRO_MONGODB_NAME}`;
  const client = new MongoClient(url);
  await client.connect();
  mongoDb = client.db();

  const pgUrl =
    process.env.DATABASE_URL ||
    `postgres://${process.env.PRO_POSTGRESQL_USER}:${process.env.PRO_POSTGRESQL_PASS}@${process.env.PRO_POSTGRESQL_HOST}:${process.env.PRO_POSTGRESQL_PORT}/${process.env.PRO_POSTGRESQL_NAME}`;
  const pool = new Pool({ connectionString: pgUrl });
  pgDb = new Kysely({ dialect: new PostgresDialect({ pool }) });
};

const getMongoDb = () => mongoDb;
const getPgDb = () => pgDb;

module.exports = { loadEnv, getMongoDb, getPgDb };
