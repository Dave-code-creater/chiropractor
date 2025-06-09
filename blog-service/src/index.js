const express = require('express');
const cors = require('cors');
const routes = require('./routes/index.routes.js');
const { loadEnv } = require('./config/index.js');

const app = express();

const start = async () => {
  if (process.env.NODE_ENV !== 'test') {
    await loadEnv();
  }
  app.use(cors());
  app.use(express.json());
  app.use('/', routes);
  if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3006;
    app.listen(PORT, () => console.log('blog-service listening on ' + PORT));
  }
};

start();

module.exports = app;
