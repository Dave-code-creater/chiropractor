function rbac(...allowedRoles) {
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({ success: false, error: 'Forbidden' });
    }
    next();
  };
}

module.exports = { rbac };
