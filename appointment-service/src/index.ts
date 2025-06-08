import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ service: 'appointment-service', status: 'ok' });
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => console.log('appointment-service listening on ' + PORT));
