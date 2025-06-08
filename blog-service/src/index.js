import express from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js';
import { loadEnv } from './config/index.js';

const app = express();

const start = async () => {
  if (process.env.NODE_ENV !== 'test') {
    await loadEnv();
  }
  app.use(cors());
  app.use(express.json());
  app.use('/', routes);
  if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3006;
    app.listen(PORT, () => console.log('blog-service listening on ' + PORT));
  }
};

start();

export default app;
