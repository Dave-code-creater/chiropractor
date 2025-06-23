const ServerConfig = require('../shared/server-config');
const routes = require('./routes/index.routes.js');
const { loadEnv } = require('./config/index.js');
const { ErrorResponse } = require('./utils/httpResponses.js');

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
        tables: ['reports', 'health_conditions', 'medical_records']
      }
    };
  } catch (error) {
    throw new Error(`Database health check failed: ${error.message}`);
  }
};

// Initialize server with enhanced configuration
const server = new ServerConfig('report-service', {
  port: process.env.PORT || 3006,
  enableRateLimit: true,
  rateLimitMax: 100, // Moderate limit for report service
  rateLimitWindow: 15 * 60 * 1000 // 15 minutes
});

// Add health check with database status
server.addHealthCheck(checkDatabaseHealth);

// Add routes
server.useRoutes('/', routes);

// Get the Express app instance
const app = server.getApp();

// Enhanced error handling
app.use((error, req, res, next) => {
  if (error instanceof ErrorResponse) {
    return error.send(res);
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
  console.log('📊 Report Service ready - Medical reports & health conditions');
});

module.exports = app;
