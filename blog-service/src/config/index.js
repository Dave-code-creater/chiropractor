const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');

let db;

const loadEnv = async () => {
  dotenv.config();
  const url =
    process.env.MONGO_URL ||
    `mongodb://${process.env.PRO_MONGODB_HOST}:${process.env.PRO_MONGODB_PORT}/${process.env.PRO_MONGODB_NAME}`;
  const client = new MongoClient(url);
  await client.connect();
  db = client.db();
};

const getDb = () => db;
module.exports = { loadEnv, getDb };
