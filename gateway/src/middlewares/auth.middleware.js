const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/httpResponses.js');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return new UnauthorizedError('No token provided').send(res);
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, process.env.PUBLIC_KEY);
    req.user = payload;
    next();
  } catch (_err) {
    return new UnauthorizedError('Invalid token').send(res);
  }
};

module.exports = authMiddleware;
