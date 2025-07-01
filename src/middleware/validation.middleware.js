const { ErrorResponse } = require('../utils/httpResponses');
const { error: logError } = require('../utils/logger');

/**
 * Validation Middleware Factory
 * Creates middleware functions for request validation using Joi schemas
 */
const validate = (schema, property = 'body') => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[property];
      
      const { error, value } = schema.validate(dataToValidate, {
        abortEarly: false, // Return all validation errors
        stripUnknown: true // Remove unknown fields
      });

      if (error) {
        const validationErrors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));

        const errorResponse = new ErrorResponse(
          'Validation failed',
          400,
          '4001',
          validationErrors
        );
        
        return errorResponse.send(res);
      }

      // Replace request data with validated data
      req[property] = value;
      next();
    } catch (error) {
      logError('Validation middleware error:', error);
      const errorResponse = new ErrorResponse(
        'Internal validation error',
        500,
        '5001'
      );
      errorResponse.send(res);
    }
  };
};

/**
 * Validation middleware for different request parts
 */
const validateBody = (schema) => validate(schema, 'body');
const validateParams = (schema) => validate(schema, 'params');
const validateQuery = (schema) => validate(schema, 'query');

module.exports = {
  validate,
  validateBody,
  validateParams,
  validateQuery
}; 