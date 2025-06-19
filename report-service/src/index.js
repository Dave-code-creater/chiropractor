const express = require('express');
const cors = require('cors');
const routes = require('./routes/index.routes.js');
const { loadEnv } = require('./config/index.js');
const { subscribe } = require('./utils/messageBroker.js');

const app = express();
if (process.env.NODE_ENV !== 'test') {
  loadEnv();
}

app.use(express.json());

app.use('/', routes);

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => console.log('report-service listening on ' + PORT));
  subscribe('posts.created', (p) => {
    console.log('report-service received post event', p);
  });
}

module.exports = app;
