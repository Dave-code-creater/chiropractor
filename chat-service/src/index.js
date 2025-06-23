const ServerConfig = require('../shared/server-config');
const routes = require('./routes/index.routes.js');
const { loadEnv } = require('./config/index.js');
const { ErrorResponse } = require('./utils/httpResponses.js');
const http = require('http');
const initSocket = require('./socket.js');

// Load environment variables
if (process.env.NODE_ENV !== 'test') {
  loadEnv();
}

// Database health check function (for MongoDB)
const checkDatabaseHealth = async () => {
  try {
    // Add your MongoDB connection check here
    // For now, we'll just return basic info
    return {
      database: {
        status: 'connected',
        type: 'mongodb',
        collections: ['conversations', 'messages', 'users']
      }
    };
  } catch (error) {
    throw new Error(`Database health check failed: ${error.message}`);
  }
};

// Initialize server with enhanced configuration
const server = new ServerConfig('chat-service', {
  port: process.env.PORT || 3004,
  enableRateLimit: true,
  rateLimitMax: 150, // Moderate rate limiting for chat service
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

// Initialize Socket.IO with the HTTP server
if (process.env.NODE_ENV !== 'test') {
  const httpServer = http.createServer(app);
  initSocket(httpServer);
  
  // Start server with Socket.IO support
  const PORT = process.env.PORT || 3004;
  httpServer.listen(PORT, () => {
    console.log(`💬 Chat Service ready - Real-time messaging on port ${PORT}`);
  });
} else {
  // For testing, use the regular server
  server.listen();
}

module.exports = app;
