const { ErrorResponse } = require('../utils/httpResponses');
const { error: logError } = require('../utils/logger');

const errorMiddleware = (error, req, res, next) => {
  // Handle custom ErrorResponse instances
  if (error instanceof ErrorResponse) {
    return error.send(res);
  }

  // Handle Joi validation errors
  if (error.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      statusCode: 400,
      errorCode: '4000',
      details: error.details.map(detail => detail.message)
    });
  }

  // Handle PostgreSQL errors
  if (error.code === '23505') { // Unique constraint violation
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
      statusCode: 409,
      errorCode: '4090'
    });
  }

  if (error.code === '23503') { // Foreign key constraint violation
    return res.status(400).json({
      success: false,
      message: 'Invalid reference to related resource',
      statusCode: 400,
      errorCode: '4001'
    });
  }

  // Handle MongoDB errors
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    return res.status(500).json({
      success: false,
      message: 'Database error',
      statusCode: 500,
      errorCode: '5001'
    });
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      statusCode: 400,
      errorCode: '4002',
      details: Object.values(error.errors).map(err => err.message)
    });
  }

  // Always log errors for debugging
  logError('Error Middleware caught error:', {
    message: error.message,
    name: error.constructor.name,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString()
  });

  // Generic error response
  return res.status(500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    statusCode: 500,
    errorCode: '5000'
  });
};

module.exports = errorMiddleware; 