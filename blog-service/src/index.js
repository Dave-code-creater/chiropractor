const express = require('express');
const cors = require('cors');
const routes = require('./routes/index.routes.js');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const { loadEnv } = require('./config/index.js');
const { ErrorResponse } = require('./utils/httpResponses.js');
const { subscribe } = require('./utils/messageBroker.js');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: "http://localhost:5173",
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));


app.use('/', routes);

if (process.env.NODE_ENV !== 'test') {
  loadEnv();
  const PORT = process.env.PORT || 3003;
  app.listen(PORT, () => console.log('blog-service listening on ' + PORT));
  subscribe('appointments.created', (msg) => {
    console.log('blog-service received appointment event', msg);
  });
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
