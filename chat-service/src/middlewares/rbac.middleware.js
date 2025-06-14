const { ForbiddenError } = require('../utils/httpResponses.js');

const doctorId = parseInt(process.env.DOCTOR_ID || '1', 10);
const staffId = parseInt(process.env.STAFF_ID || '2', 10);

const rbac = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return new ForbiddenError('not allowed').send(res);
  }

  // doctors can access everything
  if (user.role === 'doctor') {
    return next();
  }

  const allowedIds = [doctorId, staffId];

  if (req.method === 'POST' && req.path === '/messages') {
    if (!allowedIds.includes(Number(req.body.receiver))) {
      return new ForbiddenError('not allowed').send(res);
    }
  }

  if (req.method === 'GET' && req.path.startsWith('/messages/user/')) {
    const id = Number(req.params.id);
    if (id !== user.sub && !allowedIds.includes(id)) {
      return new ForbiddenError('not allowed').send(res);
    }
  }

  next();
};

module.exports = { rbac };
