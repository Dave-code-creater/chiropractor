const { errorResponse } = require('../utils/httpResponses');

/**
 * Centralized Error Handling Middleware
 * Provides consistent error responses across the application
 */

class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'INVALID_DATA');
};

const handleDuplicateFieldsDB = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists`;
  return new AppError(message, 409, 'DUPLICATE_FIELD', { field, value });
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => ({
    field: el.path,
    message: el.message,
    value: el.value
  }));

  const message = 'Invalid input data';
  return new AppError(message, 422, 'VALIDATION_ERROR', errors);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401, 'INVALID_TOKEN');

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401, 'TOKEN_EXPIRED');

const handleSequelizeValidationError = (err) => {
  const errors = err.errors.map(error => ({
    field: error.path,
    message: error.message,
    value: error.value
  }));

  return new AppError('Validation failed', 422, 'VALIDATION_ERROR', errors);
};

const handleSequelizeUniqueConstraintError = (err) => {
  const field = err.errors[0].path;
  const value = err.errors[0].value;
  const message = `${field} '${value}' already exists`;
  return new AppError(message, 409, 'DUPLICATE_FIELD', { field, value });
};

const handleSequelizeForeignKeyConstraintError = (err) => {
  const message = 'Referenced record does not exist';
  return new AppError(message, 400, 'FOREIGN_KEY_CONSTRAINT');
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    statusCode: err.statusCode,
    message: err.message,
    error: {
      code: err.code,
      details: err.details,
      stack: err.stack
    }
  });
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    return errorResponse(res, err.message, err.statusCode, err.code, err.details);
  }

  // Programming or other unknown error: don't leak error details
  console.error('ERROR 💥', err);
  
  return errorResponse(res, 'Something went wrong!', 500, 'INTERNAL_ERROR');
};

const globalErrorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err };
    error.message = err.message;

    // Handle specific error types
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    
    // Sequelize errors
    if (error.name === 'SequelizeValidationError') error = handleSequelizeValidationError(error);
    if (error.name === 'SequelizeUniqueConstraintError') error = handleSequelizeUniqueConstraintError(error);
    if (error.name === 'SequelizeForeignKeyConstraintError') error = handleSequelizeForeignKeyConstraintError(error);

    sendErrorProd(error, res);
  }
};

/**
 * Async error handler wrapper
 */
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Handle unhandled routes
 */
const handleNotFound = (req, res, next) => {
  const err = new AppError(`Can't find ${req.originalUrl} on this server!`, 404, 'ROUTE_NOT_FOUND');
  next(err);
};

/**
 * Rate limiting error handler
 */
const handleRateLimitError = (req, res) => {
  return errorResponse(res, 'Too many requests, please try again later', 429, 'RATE_LIMIT_EXCEEDED');
};

/**
 * Validation error creator
 */
const createValidationError = (message, details = null) => {
  return new AppError(message, 422, 'VALIDATION_ERROR', details);
};

/**
 * Authorization error creator
 */
const createAuthError = (message = 'You are not authorized to perform this action') => {
  return new AppError(message, 403, 'INSUFFICIENT_PERMISSIONS');
};

/**
 * Not found error creator
 */
const createNotFoundError = (resource = 'Resource') => {
  return new AppError(`${resource} not found`, 404, 'RESOURCE_NOT_FOUND');
};

/**
 * Conflict error creator
 */
const createConflictError = (message, details = null) => {
  return new AppError(message, 409, 'RESOURCE_CONFLICT', details);
};

module.exports = {
  AppError,
  globalErrorHandler,
  catchAsync,
  handleNotFound,
  handleRateLimitError,
  createValidationError,
  createAuthError,
  createNotFoundError,
  createConflictError
}; 