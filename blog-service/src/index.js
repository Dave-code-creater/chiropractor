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
        tables: ['posts', 'categories', 'tags']
      }
    };
  } catch (error) {
    throw new Error(`Database health check failed: ${error.message}`);
  }
};

// Initialize server with enhanced configuration
const server = new ServerConfig('blog-service', {
  port: process.env.PORT || 3003,
  enableRateLimit: true,
  rateLimitMax: 200, // Higher limit for blog service (public content)
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
  console.log('📝 Blog Service ready - Content management with pagination');
});

module.exports = app;
