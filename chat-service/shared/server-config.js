const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { ErrorResponse } = require('./utils/httpResponses');

/**
 * Senior-level server configuration factory
 * Implements security best practices, proper error handling, and monitoring
 */
class ServerConfig {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.options = {
      port: process.env.PORT || 3000,
      corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
      nodeEnv: process.env.NODE_ENV || 'development',
      enableRateLimit: options.enableRateLimit !== false,
      rateLimitWindow: options.rateLimitWindow || 15 * 60 * 1000, // 15 minutes
      rateLimitMax: options.rateLimitMax || 100,
      ...options
    };
    
    this.app = express();
    this.setupMiddleware();
    this.setupErrorHandling();
  }

  /**
   * Configure middleware stack with security and performance optimizations
   */
  setupMiddleware() {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // Rate limiting
    if (this.options.enableRateLimit) {
      const limiter = rateLimit({
        windowMs: this.options.rateLimitWindow,
        max: this.options.rateLimitMax,
        message: {
          success: false,
          message: 'Too many requests from this IP, please try again later.',
          statusCode: 429
        },
        standardHeaders: true,
        legacyHeaders: false,
      });
      this.app.use(limiter);
    }

    // Body parsing
    this.app.use(express.json({ 
      limit: '10mb',
      verify: (req, res, buf) => {
        try {
          JSON.parse(buf);
        } catch (e) {
          throw new ErrorResponse('Invalid JSON payload', 400, 'INVALID_JSON');
        }
      }
    }));
    
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));

    // Compression
    this.app.use(compression());

    // CORS configuration
    this.app.use(cors({
      origin: this.options.corsOrigin,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
      credentials: true,
      optionsSuccessStatus: 200
    }));

    // Request logging
    if (this.options.nodeEnv !== 'test') {
      const logFormat = this.options.nodeEnv === 'production' 
        ? 'combined' 
        : 'dev';
      this.app.use(morgan(logFormat));
    }

    // Request ID for tracing
    this.app.use((req, res, next) => {
      req.id = require('crypto').randomUUID();
      res.setHeader('X-Request-ID', req.id);
      next();
    });
  }

  /**
   * Setup comprehensive error handling
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use('*', (req, res) => {
      const error = new ErrorResponse(
        `Resource not found: ${req.method} ${req.originalUrl}`,
        404,
        'RESOURCE_NOT_FOUND'
      );
      error.send(res);
    });

    // Global error handler
    this.app.use((error, req, res, next) => {
      // Log error for monitoring
      this.logError(error, req);

      // Handle known error types
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const validationError = new ErrorResponse(
          'Validation failed',
          400,
          'VALIDATION_ERROR',
          error.details
        );
        return validationError.send(res);
      }

      // Handle JWT errors
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        const authError = new ErrorResponse(
          'Authentication failed',
          401,
          'AUTH_ERROR'
        );
        return authError.send(res);
      }

      // Handle database errors
      if (error.code && error.code.startsWith('23')) { // PostgreSQL constraint violations
        const dbError = new ErrorResponse(
          'Database constraint violation',
          409,
          'DB_CONSTRAINT_ERROR'
        );
        return dbError.send(res);
      }

      // Default server error
      const serverError = new ErrorResponse(
        this.options.nodeEnv === 'production' 
          ? 'Internal server error' 
          : error.message,
        500,
        'INTERNAL_SERVER_ERROR'
      );

      return serverError.send(res);
    });
  }

  /**
   * Enhanced error logging
   */
  logError(error, req = null) {
    const timestamp = new Date().toISOString();
    const errorLog = {
      timestamp,
      service: this.serviceName,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code || error.statusCode
      },
      request: req ? {
        id: req.id,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      } : null
    };

    if (this.options.nodeEnv === 'production') {
      // In production, use structured logging
      console.error(JSON.stringify(errorLog));
    } else {
      // In development, use readable format
      console.error(`[${timestamp}] ${this.serviceName} ERROR:`, error.message);
      if (error.stack) console.error(error.stack);
    }
  }

  /**
   * Add routes to the application
   */
  useRoutes(path, router) {
    this.app.use(path, router);
    return this;
  }

  /**
   * Add health check endpoint
   */
  addHealthCheck(customHealthCheck = null) {
    this.app.get('/health', async (req, res) => {
      try {
        const healthData = {
          service: this.serviceName,
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          version: process.env.npm_package_version || '1.0.0'
        };

        // Run custom health checks if provided
        if (customHealthCheck && typeof customHealthCheck === 'function') {
          const customData = await customHealthCheck();
          Object.assign(healthData, customData);
        }

        res.status(200).json(healthData);
      } catch (error) {
        this.logError(error, req);
        res.status(503).json({
          service: this.serviceName,
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error.message
        });
      }
    });
    return this;
  }

  /**
   * Start the server with graceful shutdown handling
   */
  listen(callback = null) {
    if (this.options.nodeEnv === 'test') {
      return this.app;
    }

    const server = this.app.listen(this.options.port, () => {
      console.log(`🚀 ${this.serviceName} listening on port ${this.options.port}`);
      console.log(`📊 Environment: ${this.options.nodeEnv}`);
      console.log(`🔗 Health check: http://localhost:${this.options.port}/health`);
      
      if (callback) callback();
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
      
      server.close((err) => {
        if (err) {
          console.error('❌ Error during server shutdown:', err);
          process.exit(1);
        }
        
        console.log('✅ Server closed successfully');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️  Forcing shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    return server;
  }

  /**
   * Get the Express app instance
   */
  getApp() {
    return this.app;
  }
}

module.exports = ServerConfig; 