const express = require('express');
const cors = require('cors');
const routes = require('./routes/index.routes.js');
const { loadEnv } = require('./config/index.js');

const app = express();
if (process.env.NODE_ENV !== 'test') {
  loadEnv();
}

app.use(express.json());
app.use(cors());
app.use('/', routes);

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3007;
  app.listen(PORT, () => console.log('booking-service listening on ' + PORT));
}

module.exports = app;
