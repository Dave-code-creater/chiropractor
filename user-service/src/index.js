const express = require('express');
const cors = require('cors');
const routes = require('./routes/index.routes.js');
const { loadEnv } = require('./config/index.js');
const { ErrorResponse } = require('./utils/httpResponses.js');

const app = express();
if (process.env.NODE_ENV !== 'test') {
  loadEnv();
}
app.use(cors());
app.use(express.json());

app.use('/', routes);

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3002;
  app.listen(PORT, () => console.log('user-service listening on ' + PORT));
}

app.use((error, req, res, next) => {
  if (error instanceof ErrorResponse) {
    return error.send(res); // Use the custom `send()` method
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(error); // only log full stack in dev
  }

  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: error.message || 'Internal Server Error',
    errorCode: '5000',
  });
});


module.exports = app;
