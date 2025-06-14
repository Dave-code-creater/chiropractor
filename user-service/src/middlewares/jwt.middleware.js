const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/httpResponses.js');

function jwtMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError('No token provided');
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ['HS256'],
    });
    req.user = payload;
    next();
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return new UnauthorizedError('Invalid token').send(res);
    }

    return new UnauthorizedError().send(res); // fallback
  }
}

module.exports = jwtMiddleware;

