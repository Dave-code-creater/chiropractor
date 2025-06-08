import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';

let db;

export const loadEnv = async () => {
  dotenv.config();
  const client = new MongoClient(process.env.MONGO_URL);
  await client.connect();
  db = client.db();
};

export const getDb = () => db;
