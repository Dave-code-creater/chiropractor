const { DOCTOR_ID, STAFF_ID } = require('../utils/constants.js');

const rbac = (...allowed) => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'unauthorized' });
    }
    if (allowed.length && !allowed.includes(user.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  };
};

const patientRestriction = (req, res, next) => {
  const user = req.user;
  if (user.role === 'patient') {
    const target = req.body.withUserId || req.body.receiver;
    if (target && target !== DOCTOR_ID && target !== STAFF_ID) {
      return res.status(403).json({ error: 'not allowed' });
    }
  }
  next();
};

module.exports = { rbac, patientRestriction };
