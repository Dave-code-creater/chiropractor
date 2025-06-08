import express from 'express';
import cors from 'cors';
import { createProxyMiddleware } from 'http-proxy-middleware';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth', createProxyMiddleware({ target: 'http://auth-service:3001', changeOrigin: true }));
app.use('/users', createProxyMiddleware({ target: 'http://user-service:3002', changeOrigin: true }));
app.use('/reports', createProxyMiddleware({ target: 'http://report-service:3003', changeOrigin: true }));
app.use('/appointments', createProxyMiddleware({ target: 'http://appointment-service:3004', changeOrigin: true }));
app.use('/chat', createProxyMiddleware({ target: 'http://chat-service:3005', changeOrigin: true }));
app.use('/blog', createProxyMiddleware({ target: 'http://blog-service:3006', changeOrigin: true }));

app.get('/', (_req, res) => {
  res.json({ service: 'gateway', status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`gateway listening on ${PORT}`));
