/**
 * Enhanced HTTP Response utilities for consistent API responses
 * Implements senior-level patterns for error handling and response formatting
 */

class BaseResponse {
  constructor(message, statusCode, data = null, meta = null) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    
    if (data !== null) {
      this.data = data;
    }
    
    if (meta !== null) {
      this.meta = meta;
    }
    
    this.timestamp = new Date().toISOString();
  }

  send(res) {
    return res.status(this.statusCode).json(this);
  }
}

class SuccessResponse extends BaseResponse {
  constructor(message = 'Success', data = null, statusCode = 200, meta = null) {
    super(message, statusCode, data, meta);
  }
}

class ErrorResponse extends BaseResponse {
  constructor(message, statusCode = 500, errorCode = null, details = null) {
    super(message, statusCode);
    this.success = false;
    
    if (errorCode) {
      this.errorCode = errorCode;
    }
    
    if (details) {
      this.details = details;
    }

    // Capture stack trace for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      Error.captureStackTrace(this, ErrorResponse);
    }
  }
}

class ValidationErrorResponse extends ErrorResponse {
  constructor(errors, message = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR', errors);
  }
}

class NotFoundResponse extends ErrorResponse {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedResponse extends ErrorResponse {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenResponse extends ErrorResponse {
  constructor(message = 'Access denied') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictResponse extends ErrorResponse {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}

class TooManyRequestsResponse extends ErrorResponse {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Paginated response helper
 */
class PaginatedResponse extends SuccessResponse {
  constructor(data, pagination, message = 'Success') {
    const meta = {
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: pagination.total,
        totalPages: Math.ceil(pagination.total / pagination.limit),
        hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
        hasPrev: pagination.page > 1
      }
    };
    
    super(message, data, 200, meta);
  }
}

/**
 * Response factory for common patterns
 */
class ResponseFactory {
  static success(data = null, message = 'Success', statusCode = 200) {
    return new SuccessResponse(message, data, statusCode);
  }

  static created(data = null, message = 'Resource created successfully') {
    return new SuccessResponse(message, data, 201);
  }

  static updated(data = null, message = 'Resource updated successfully') {
    return new SuccessResponse(message, data, 200);
  }

  static deleted(message = 'Resource deleted successfully') {
    return new SuccessResponse(message, null, 200);
  }

  static error(message, statusCode = 500, errorCode = null, details = null) {
    return new ErrorResponse(message, statusCode, errorCode, details);
  }

  static validationError(errors, message = 'Validation failed') {
    return new ValidationErrorResponse(errors, message);
  }

  static notFound(resource = 'Resource') {
    return new NotFoundResponse(resource);
  }

  static unauthorized(message = 'Authentication required') {
    return new UnauthorizedResponse(message);
  }

  static forbidden(message = 'Access denied') {
    return new ForbiddenResponse(message);
  }

  static conflict(message = 'Resource conflict') {
    return new ConflictResponse(message);
  }

  static tooManyRequests(message = 'Too many requests') {
    return new TooManyRequestsResponse(message);
  }

  static paginated(data, pagination, message = 'Success') {
    return new PaginatedResponse(data, pagination, message);
  }
}

/**
 * Express middleware for handling async errors
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Express middleware for standardizing success responses
 */
const responseHandler = (req, res, next) => {
  res.success = (data = null, message = 'Success', statusCode = 200) => {
    return ResponseFactory.success(data, message, statusCode).send(res);
  };

  res.created = (data = null, message = 'Resource created successfully') => {
    return ResponseFactory.created(data, message).send(res);
  };

  res.updated = (data = null, message = 'Resource updated successfully') => {
    return ResponseFactory.updated(data, message).send(res);
  };

  res.deleted = (message = 'Resource deleted successfully') => {
    return ResponseFactory.deleted(message).send(res);
  };

  res.paginated = (data, pagination, message = 'Success') => {
    return ResponseFactory.paginated(data, pagination, message).send(res);
  };

  next();
};

module.exports = {
  BaseResponse,
  SuccessResponse,
  ErrorResponse,
  ValidationErrorResponse,
  NotFoundResponse,
  UnauthorizedResponse,
  ForbiddenResponse,
  ConflictResponse,
  TooManyRequestsResponse,
  PaginatedResponse,
  ResponseFactory,
  asyncHandler,
  responseHandler
}; 