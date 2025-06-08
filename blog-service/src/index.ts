import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({ service: 'blog-service', status: 'ok' });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => console.log('blog-service listening on ' + PORT));
