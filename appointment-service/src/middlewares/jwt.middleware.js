const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res
        .status(401)
        .json({ success: false, error: 'Access token required' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ success: false, error: 'Invalid or expired token' });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res
        .status(401)
        .json({ success: false, error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, error: 'Insufficient permissions' });
    }

    next();
  };
}

// Legacy export for backward compatibility
function jwtMiddleware(req, res, next) {
  return verifyToken(req, res, next);
}

module.exports = {
  verifyToken,
  requireRole,
  jwtMiddleware
};

