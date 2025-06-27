const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');

// Load environment variables
require('dotenv').config();

// Import configurations
const config = require('./config');
const { connectPostgreSQL, connectMongoDB } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const blogRoutes = require('./routes/blog.routes');
const chatRoutes = require('./routes/chat.routes');
const reportRoutes = require('./routes/report.routes');
const healthRoutes = require('./routes/health.routes');

// Import middleware
const errorMiddleware = require('./middleware/error.middleware');
const authMiddleware = require('./middleware/auth.middleware');

// Import socket handlers
const socketHandler = require('./socket/socket.handler');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Make io available to routes through app.locals
app.locals.io = io;

// Basic middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));
app.disable('x-powered-by');
app.use(helmet());
app.use(compression());

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
    retryAfter: '15 minutes'
  }
});
app.use(limiter);

// Database connections
async function initializeDatabases() {
  let postgresConnected = false;
  let mongoConnected = false;

  // Try PostgreSQL connection
  try {
    await connectPostgreSQL();
    postgresConnected = true;
  } catch (error) {
    console.warn('⚠️ PostgreSQL connection failed:', error.message);
    console.warn('⚠️ Running without PostgreSQL - some features may not work');
  }

  // Try MongoDB connection
  try {
    await connectMongoDB();
    mongoConnected = true;
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed:', error.message);
    console.warn('⚠️ Running without MongoDB - blog and chat features may not work');
  }

  if (postgresConnected && mongoConnected) {
    console.log('✅ All databases connected successfully');
  } else if (postgresConnected || mongoConnected) {
    console.log('⚠️ Partial database connectivity - some features may be limited');
  } else {
    console.warn('⚠️ No database connections - running in limited mode');
  }
}

// Routes
app.use('/health', healthRoutes);

// API v1 routes
const apiV1 = express.Router();

// Auth routes (no auth required)
apiV1.use('/auth', authRoutes);

// Protected routes (auth required)
apiV1.use('/users', authMiddleware, userRoutes);
apiV1.use('/appointments', authMiddleware, appointmentRoutes);
apiV1.use('/blog', authMiddleware, blogRoutes);
apiV1.use('/chat', authMiddleware, chatRoutes);
apiV1.use('/reports', authMiddleware, reportRoutes);

// Mount API routes
app.use('/v1/api/2025', apiV1);

// Backward compatibility routes
app.use('/auth', authRoutes);

// Socket.IO connection handling
socketHandler(io);

// Error handling middleware (must be last)
app.use(errorMiddleware);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    statusCode: 404
  });
});

// Start server
async function startServer() {
  try {
    await initializeDatabases();
    
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Chiropractor Monolith Server running on port ${PORT}`);
      console.log(`🌐 CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, server, io }; 