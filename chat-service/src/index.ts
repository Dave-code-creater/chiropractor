import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ service: 'chat-service', status: 'ok' });
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => console.log('chat-service listening on ' + PORT));
