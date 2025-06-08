import express from 'express';
import cors from 'cors';
import routes from './routes/index.routes.js';
import { loadEnv } from './config/index.js';

const app = express();
loadEnv();
app.use(cors());
app.use(express.json());

app.use('/', routes);

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log('report-service listening on ' + PORT));
