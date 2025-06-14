// src/middlewares/rbac.middleware.js
function rbac(...allowedRoles) {
  return (req, res, next) => {
    const userRole = req.user?.role;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res
        .status(403)
        .json({ success: false, error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { rbac };