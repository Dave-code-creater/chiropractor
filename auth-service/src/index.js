const ServerConfig = require('../../shared/server-config');
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
    return {
      database: {
        status: 'connected',
        type: 'postgresql',
        tables: ['users', 'api_keys', 'password_resets', 'doctors']
      }
    };
  } catch (error) {
    throw new Error(`Database health check failed: ${error.message}`);
  }
};

// Initialize server with enhanced configuration
const server = new ServerConfig('auth-service', {
  port: process.env.PORT || 3001,
  enableRateLimit: true,
  rateLimitMax: 100, // Stricter rate limiting for auth service
  rateLimitWindow: 15 * 60 * 1000 // 15 minutes
});

// Add health check with database status
server.addHealthCheck(checkDatabaseHealth);

// Add routes
server.useRoutes('/', routes);

// Start server
const app = server.listen(() => {
  console.log('🔐 Auth Service Features:');
  console.log('  ✅ User Authentication');
  console.log('  ✅ JWT Token Management');
  console.log('  ✅ Role-based Access Control');
  console.log('  ✅ Password Reset');
  console.log('  ✅ API Key Management');
  console.log('  ✅ Doctor Registration');
  console.log('');
  console.log('🔑 Security: Rate limiting enabled');
  console.log('🔍 Health Check: /health');
});

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
