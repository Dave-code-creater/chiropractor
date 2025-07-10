const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require('cookie-parser');

// Load environment variables
require('dotenv').config();

// Import configurations
const config = require('./config');
const { connectPostgreSQL } = require('./config/database');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const blogRoutes = require('./routes/blog.routes');
const chatRoutes = require('./routes/chat.routes');
const reportRoutes = require('./routes/report.routes');
const incidentRoutes = require('./routes/incident.routes');
const healthRoutes = require('./routes/health.routes');
const clinicalNotesRoutes = require('./routes/clinical-notes.routes');
const vitalsRoutes = require('./routes/vitals.routes');


// Import middleware
const errorMiddleware = require('./middleware/error.middleware');

// Import logger
const { info, warn, error: logError } = require('./utils/logger');



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
app.use(cookieParser());

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

// Database connections - PostgreSQL only
async function initializeDatabases() {
  try {
    await connectPostgreSQL();
    info('PostgreSQL connected successfully');
  } catch (error) {
    logError('PostgreSQL connection failed:', { message: error.message });
    throw error; // Exit if PostgreSQL fails since it's our only database
  }
}

// Routes
app.use('/health', healthRoutes);

// API v1 routes
const apiV1 = express.Router();

// Auth routes (no auth required)
apiV1.use('/auth', authRoutes);

// Protected routes (auth required)
apiV1.use('/users', userRoutes);
apiV1.use('/appointments', appointmentRoutes);
apiV1.use('/blog', blogRoutes);
apiV1.use('/chat', chatRoutes);
apiV1.use('/reports', reportRoutes);
apiV1.use('/incidents', incidentRoutes);




// Mount API routes
app.use('/v1/api/2025', apiV1);



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
    info('Starting server initialization...');
    info('Attempting to connect to databases...');
    await initializeDatabases();
    info('Database initialization completed successfully');
    
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      info(`Chiropractor Monolith Server running on port ${PORT}`);
      info(`CORS origin: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      info(`Health check: http://localhost:${PORT}/health`);
      info('Server startup completed successfully');
    });
  } catch (error) {
    logError('Failed to start server:', error);
    logError('Error details:', {
      message: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    info('Process terminated');
  });
});

process.on('SIGINT', () => {
  info('SIGINT received, shutting down gracefully');
  server.close(() => {
    info('Process terminated');
  });
});

startServer();

module.exports = { app, server, io }; 