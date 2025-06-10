const jwt = require('jsonwebtoken');

function jwtMiddleware(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    const payload = jwt.verify(token, process.env.PUBLIC_KEY);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = jwtMiddleware;

