const express = require('express');
const cors = require('cors');
const http = require('http');
const routes = require('./routes/index.routes.js');
const { loadEnv } = require('./config/index.js');
const initSocket = require('./socket.js');

const app = express();

const start = async () => {
  if (process.env.NODE_ENV !== 'test') {
    await loadEnv();
  }

  app.use(cors());
  app.use(express.json());
  app.use('/', routes);
  if (process.env.NODE_ENV !== 'test') {
    const server = http.createServer(app);
    initSocket(server);
    const PORT = process.env.PORT || 3005;
    server.listen(PORT, () => console.log('chat-service listening on ' + PORT));
  }
};

start();

module.exports = app;
