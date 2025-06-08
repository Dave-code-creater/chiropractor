import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

let db;

export const loadEnv = async () => {
  dotenv.config();
  const url =
    process.env.MONGO_URL ||
    `mongodb://${process.env.PRO_MONGODB_HOST}:${process.env.PRO_MONGODB_PORT}/${process.env.PRO_MONGODB_NAME}`;
  const client = new MongoClient(url);
  await client.connect();
  db = client.db();
};

export const getDb = () => db;
