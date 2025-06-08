import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ service: 'report-service', status: 'ok' });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => console.log('report-service listening on ' + PORT));
