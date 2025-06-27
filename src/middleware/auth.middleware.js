const jwt = require('jsonwebtoken');
const config = require('../config');
const { ErrorResponse } = require('../utils/httpResponses');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ErrorResponse('Access token required', 401, '4001');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
      next();
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        throw new ErrorResponse('Token expired', 401, '4002');
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw new ErrorResponse('Invalid token', 401, '4003');
      } else {
        throw new ErrorResponse('Token verification failed', 401, '4004');
      }
    }
  } catch (error) {
    if (error instanceof ErrorResponse) {
      return error.send(res);
    }
    
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      statusCode: 401,
      errorCode: '4000'
    });
  }
};

module.exports = authMiddleware; 