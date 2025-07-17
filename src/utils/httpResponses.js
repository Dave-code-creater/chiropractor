/**
 * HTTP Response Utilities
 * Standardized response classes for consistent API responses
 */

class BaseResponse {
  constructor(message, statusCode, data = null, errorCode = null, meta = null) {
    this.success = statusCode < 400;
    this.message = message;
    this.statusCode = statusCode;
    this.data = data;
    this.meta = meta;
    this.errorCode = errorCode;
  }

  send(res) {
    const response = {
      success: this.success,
      message: this.message,
      data: this.data
    };

    // Add meta if provided
    if (this.meta) {
      response.meta = this.meta;
    }

    // Add error code if it's an error response
    if (this.errorCode && !this.success) {
      response.error_code = this.errorCode;
    }

    return res.status(this.statusCode).json(response);
  }
}

// Success Response Classes
class SuccessResponse extends BaseResponse {
  constructor(message, statusCode = 200, data = null, meta = null) {
    super(message, statusCode, data, null, meta);
  }
}

class SignupSuccess extends BaseResponse {
  constructor({ metadata }) {
    super('Account created successfully! Welcome to our platform.', 201, metadata);
  }
}

class LoginSuccess extends BaseResponse {
  constructor({ metadata }) {
    super('Login successful', 200, metadata);
  }
}

class LogoutSuccess extends BaseResponse {
  constructor() {
    super('Logged out successfully', 200);
  }
}

class ProfileSuccess extends BaseResponse {
  constructor({ metadata }) {
    super('Profile retrieved successfully', 200, metadata);
  }
}

class PatientCreatedSuccess extends BaseResponse {
  constructor({ metadata }) {
    super('Patient created successfully', 201, metadata);
  }
}

class PatientsRetrievedSuccess extends BaseResponse {
  constructor({ metadata }) {
    super('Patients retrieved successfully', 200, metadata);
  }
}

class AppointmentCreatedSuccess extends BaseResponse {
  constructor({ metadata }) {
    super('Appointment created successfully', 201, metadata);
  }
}

class AppointmentsRetrievedSuccess extends BaseResponse {
  constructor({ metadata }) {
    super('Appointments retrieved successfully', 200, metadata);
  }
}

class ConversationCreatedSuccess extends BaseResponse {
  constructor({ metadata }) {
    super('Conversation created successfully', 201, metadata);
  }
}

class MessageSentSuccess extends BaseResponse {
  constructor({ metadata }) {
    super('Message sent successfully', 201, metadata);
  }
}

class ReportCreatedSuccess extends BaseResponse {
  constructor({ metadata }) {
    super('Report created successfully', 201, metadata);
  }
}

class ReportsRetrievedSuccess extends BaseResponse {
  constructor({ metadata }) {
    super('Reports retrieved successfully', 200, metadata);
  }
}

class BlogPostCreatedSuccess extends BaseResponse {
  constructor({ metadata }) {
    super('Blog post created successfully', 201, metadata);
  }
}

class BlogPostsRetrievedSuccess extends BaseResponse {
  constructor({ metadata }) {
    super('Blog posts retrieved successfully', 200, metadata);
  }
}

// Error Response Classes
class ErrorResponse extends BaseResponse {
  constructor(message, statusCode = 500, errorCode = null, errors = null) {
    super(message, statusCode, null, errorCode);
    this.errors = errors;
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: false,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      ...(this.errors && { errors: this.errors })
    });
  }
}

class BadRequestError extends ErrorResponse {
  constructor(message = 'Bad Request', errorCode = '4000') {
    super(message, 400, errorCode);
  }
}

class UnauthorizedError extends ErrorResponse {
  constructor(message = 'Unauthorized', errorCode = '4001') {
    super(message, 401, errorCode);
  }
}

class ForbiddenError extends ErrorResponse {
  constructor(message = 'Forbidden', errorCode = '4003') {
    super(message, 403, errorCode);
  }
}

class NotFoundError extends ErrorResponse {
  constructor(message = 'Not Found', errorCode = '4004') {
    super(message, 404, errorCode);
  }
}

class ConflictError extends ErrorResponse {
  constructor(message = 'Conflict', errorCode = '4009') {
    super(message, 409, errorCode);
  }
}

class ValidationError extends ErrorResponse {
  constructor(message, errors = null, errorCode = '4001') {
    super(message, 400, errorCode, errors);
  }
}

class InternalServerError extends ErrorResponse {
  constructor(message = 'Internal Server Error', errorCode = '5000') {
    super(message, 500, errorCode);
  }
}

module.exports = {
  BaseResponse,
  SuccessResponse,
  SignupSuccess,
  LoginSuccess,
  LogoutSuccess,
  ProfileSuccess,
  PatientCreatedSuccess,
  PatientsRetrievedSuccess,
  AppointmentCreatedSuccess,
  AppointmentsRetrievedSuccess,
  ConversationCreatedSuccess,
  MessageSentSuccess,
  ReportCreatedSuccess,
  ReportsRetrievedSuccess,
  BlogPostCreatedSuccess,
  BlogPostsRetrievedSuccess,
  ErrorResponse,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError
}; 