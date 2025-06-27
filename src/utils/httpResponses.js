class ErrorResponse extends Error {
  constructor(message, statusCode = 500, errorCode = '5000', data = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.data = data;
    this.success = false;
    
    Error.captureStackTrace(this, this.constructor);
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      statusCode: this.statusCode,
      errorCode: this.errorCode,
      data: this.data
    });
  }
}

class SuccessResponse {
  constructor(message, statusCode = 200, data = null) {
    this.message = message;
    this.statusCode = statusCode;
    this.data = data;
    this.success = true;
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      statusCode: this.statusCode,
      data: this.data
    });
  }
}

module.exports = {
  ErrorResponse,
  SuccessResponse
}; 