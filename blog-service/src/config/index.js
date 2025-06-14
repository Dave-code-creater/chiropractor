const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

let mongoDb;
let pgDb;

const loadEnv = async () => {
  dotenv.config();
  const mongoUrl =
    process.env.MONGO_URL ||
    `mongodb://${process.env.PRO_MONGODB_HOST}:${process.env.PRO_MONGODB_PORT}/${process.env.PRO_MONGODB_NAME}`;
  const client = new MongoClient(mongoUrl);
  await client.connect();
  mongoDb = client.db();

  // Dynamically require postgres deps so tests run without them installed
  const { Pool } = require('pg');
  const { Kysely, PostgresDialect } = require('kysely');
  const pgUrl =
    process.env.DATABASE_URL ||
    `postgres://${process.env.PRO_POSTGRESQL_USER}:${process.env.PRO_POSTGRESQL_PASS}@${process.env.PRO_POSTGRESQL_HOST}:${process.env.PRO_POSTGRESQL_PORT}/${process.env.PRO_POSTGRESQL_NAME}`;
  const pool = new Pool({ connectionString: pgUrl });
  pgDb = new Kysely({ dialect: new PostgresDialect({ pool }) });
};

const getMongoDb = () => mongoDb;
const getPgDb = () => pgDb;

module.exports = { loadEnv, getMongoDb, getPgDb };
