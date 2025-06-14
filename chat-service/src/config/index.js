const dotenv = require('dotenv');
const mongoose = require('mongoose');

let db;

const loadEnv = async () => {
  dotenv.config();
  const url =
    process.env.MONGO_URL ||
    `mongodb://${process.env.PRO_MONGODB_HOST}:${process.env.PRO_MONGODB_PORT}/${process.env.PRO_MONGODB_NAME}`;
  await mongoose.connect(url);
  db = mongoose.connection;
};

const getDb = () => db;

module.exports = { loadEnv, getDb };
