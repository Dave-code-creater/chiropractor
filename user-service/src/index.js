const ServerConfig = require('../shared/server-config');
const routes = require('./routes/index.routes.js');
const { loadEnv } = require('./config/index.js');
const { ErrorResponse } = require('./utils/httpResponses.js');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');

// Load environment variables
if (process.env.NODE_ENV !== 'test') {
  loadEnv();
}

// Database health check function
const checkDatabaseHealth = async () => {
  try {
    // Add your database connection check here
    // For now, we'll just return basic info
    return {
      database: {
        status: 'connected',
        type: 'postgresql',
        tables: ['patients', 'clinical_notes', 'patient_vitals', 'reports']
      }
    };
  } catch (error) {
    throw new Error(`Database health check failed: ${error.message}`);
  }
};

// Initialize server with enhanced configuration
const server = new ServerConfig('user-service', {
  port: process.env.PORT || 3002,
  enableRateLimit: true,
  rateLimitMax: 200, // Higher limit for user service
  rateLimitWindow: 15 * 60 * 1000 // 15 minutes
});

// Add health check with database status
server.addHealthCheck(checkDatabaseHealth);

// Add routes
server.useRoutes('/', routes);

// Get the Express app instance
const app = server.getApp();

// Add custom error handling
app.use((error, req, res, next) => {
  if (error instanceof ErrorResponse) {
    return error.send(res); // Use the custom `send()` method
  }

  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }

  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: error.message || 'Internal Server Error',
    errorCode: '5000',
  });
});

// Start server
server.listen(() => {
  console.log('🏥 User Service ready - Patient management & clinical notes');
});

module.exports = app;
