import express from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js';
import { loadEnv } from './config/index.js';

const app = express();

const start = async () => {
  await loadEnv();
  app.use(cors());
  app.use(express.json());
  app.use('/', routes);
  const PORT = process.env.PORT || 3005;
  app.listen(PORT, () => console.log('chat-service listening on ' + PORT));
};

start();
