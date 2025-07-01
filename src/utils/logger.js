const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Define log levels
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each log level
const logColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Add colors to winston
winston.addColors(logColors);

// Create logs directory
const logsDir = path.join(process.cwd(), 'logs');

// Format for file logs
const fileLogFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Format for console logs (only in development)
const consoleLogFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `[${timestamp}] ${level}: ${message} ${metaStr}`;
  })
);

// Daily rotate file transport for all logs
const allLogsRotate = new DailyRotateFile({
  filename: path.join(logsDir, 'app-%DATE%.log'),
  datePattern: process.env.LOG_DATE_PATTERN || 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: process.env.LOG_MAX_FILE_SIZE || '20m',
  maxFiles: process.env.LOG_MAX_FILES || '30d',
  format: fileLogFormat,
});

// Daily rotate file transport for error logs only
const errorLogsRotate = new DailyRotateFile({
  filename: path.join(logsDir, 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  level: 'error',
  format: fileLogFormat,
});

// Daily rotate file transport for auth logs
const authLogsRotate = new DailyRotateFile({
  filename: path.join(logsDir, 'auth-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  format: fileLogFormat,
});

// Daily rotate file transport for chat logs
const chatLogsRotate = new DailyRotateFile({
  filename: path.join(logsDir, 'chat-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  format: fileLogFormat,
});

// Daily rotate file transport for database logs
const databaseLogsRotate = new DailyRotateFile({
  filename: path.join(logsDir, 'database-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  format: fileLogFormat,
});

// Daily rotate file transport for API logs
const apiLogsRotate = new DailyRotateFile({
  filename: path.join(logsDir, 'api-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '30d',
  format: fileLogFormat,
});

// Create the main logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  defaultMeta: { service: 'chiropractor-app' },
  transports: [
    allLogsRotate,
    errorLogsRotate,
  ],
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'exceptions-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: fileLogFormat,
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logsDir, 'rejections-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      format: fileLogFormat,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: consoleLogFormat,
  }));
}

// Create specialized loggers for different modules
const authLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  defaultMeta: { service: 'auth-service' },
  transports: [authLogsRotate],
  format: fileLogFormat,
});

const chatLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  defaultMeta: { service: 'chat-service' },
  transports: [chatLogsRotate],
  format: fileLogFormat,
});

const databaseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  defaultMeta: { service: 'database-service' },
  transports: [databaseLogsRotate],
  format: fileLogFormat,
});

const apiLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: logLevels,
  defaultMeta: { service: 'api-service' },
  transports: [apiLogsRotate],
  format: fileLogFormat,
});

// Export the main logger with convenience methods
module.exports = {
  // Main logger
  logger,
  
  // Specialized loggers
  auth: authLogger,
  chat: chatLogger,
  database: databaseLogger,
  api: apiLogger,
  
  // Convenience methods that use the main logger
  info: (message, meta = {}) => logger.info(message, meta),
  warn: (message, meta = {}) => logger.warn(message, meta),
  error: (message, meta = {}) => logger.error(message, meta),
  debug: (message, meta = {}) => logger.debug(message, meta),
  http: (message, meta = {}) => logger.http(message, meta),
}; 