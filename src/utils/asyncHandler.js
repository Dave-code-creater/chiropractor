const { error: logError } = require('./logger');

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((error) => {
    // Log the error with context for debugging
    logError('AsyncHandler caught error:', {
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      params: req.params,
      query: req.query,
      user_id: req.user?.id,
      user_role: req.user?.role,
      error_message: error.message,
      error_stack: error.stack,
      error_name: error.constructor.name
    });
    
    next(error);
  });
};

module.exports = asyncHandler; 