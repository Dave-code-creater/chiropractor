const { UnauthorizedError } = require('../utils/httpResponses.js');

const authMiddleware = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return new UnauthorizedError('No token provided').send(res);
  }

  try {
    const verifyRes = await fetch('http://localhost:3001/verify', {
      method: 'POST',
      headers: {
        authorization: authHeader,
      },
    });

    const data = await verifyRes.json();

    if (!verifyRes.ok) {
      return res.status(verifyRes.status).json(data);
    }

    req.user = data.metadata;
    next();
  } catch (err) {
    return new UnauthorizedError('Invalid token').send(res);
  }
};

module.exports = authMiddleware;
