import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ service: 'auth-service', status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('auth-service listening on ' + PORT));
