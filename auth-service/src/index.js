const express = require('express');
const cors = require('cors');
const routes = require('./routes/index.routes.js');
const { loadEnv } = require('./config/index.js');

const app = express();
if (process.env.NODE_ENV !== 'test') {
  loadEnv();
}
app.use(cors());
app.use(express.json());

app.use('/', routes);

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log('auth-service listening on ' + PORT));
}

app.use((error, req, res, next) => {
  const statusCode = error.status || 500;

  if (process.env.NODE_ENV !== 'production') {
    console.error(error); // only log full stack in dev
  }

  return res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: error.message || 'Internal Server Error',
  });
});

module.exports = app;
