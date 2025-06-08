import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ service: 'user-service', status: 'ok' });
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => console.log('user-service listening on ' + PORT));
