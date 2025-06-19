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
  const PORT = process.env.PORT || 3004;
  app.listen(PORT, () => console.log('appointment-service listening on ' + PORT));
  subscribe('users.deleted', (u) => {
    console.log('received user deleted event', u);
  });
}

module.exports = app;
