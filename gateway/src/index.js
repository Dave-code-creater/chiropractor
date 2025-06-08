import express from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js';
import { loadEnv } from './config/index.js';

const app = express();
if (process.env.NODE_ENV !== 'test') {
  loadEnv();
}
app.use(cors());
app.use(express.json());

app.use('/', routes);

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log('gateway listening on ' + PORT));
}

export default app;
