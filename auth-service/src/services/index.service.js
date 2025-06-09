const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  createUser,
  findUserByUsername,
  findUserByEmail,
  findUserById,
} = require('../repositories/user.repo.js');

const {
  insertApiKey,
  findApiKeyByUser,
  deleteApiKeyByKey,
} = require('../repositories/apiKey.repo.js');

const {
  BadRequestError,
  ConflictRequestError,
  UnauthorizedError,
  InvalidRefreshTokenError,
  InternalServerError
} = require('../utils/httpResponses.js');

const { signUpValidator, signInValidator } = require('../validators/access.js');
const { v4: uuidv4 } = require('UUID');
const UAParser = require('ua-parser-js');

class AuthService {
  static async register(data, req) {
    const { error } = signUpValidator.validate(data);
    if (error) {
      throw new BadRequestError(error.details[0].message, '4001');
    }

    const { email, password, role = 'patient', first_name, last_name } = data;

    const existing = await findUserByEmail(email);
    if (existing) {
      throw new ConflictRequestError('email taken');
    }

    const username = `${first_name.toLowerCase()}${last_name.toLowerCase()}${Date.now()}`;
    const hash = await bcrypt.hash(password, 10);

    const user = await createUser({
      username,
      email,
      password_hash: hash,
      role,
    });
    if (!user) {
      throw new InternalServerError('user creation failed', '5002');
    }

    return await AuthService.login({ email, password }, req);
  }

  static async login(data, req) {
    const { error } = signInValidator.validate(data);
    if (error) throw new BadRequestError(error.details[0].message, '4002');

    const { email, password } = data;
    const user = await findUserByEmail(email);
    if (!user) throw new UnauthorizedError('invalid credentials', '4011');

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new UnauthorizedError('invalid credentials', '4012');

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new InternalServerError('JWT secret not configured', '5001');

    // Parse User Agent
    const parser = new UAParser(req.headers['user-agent']);
    const ua = parser.getResult();

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const accessToken = jwt.sign({ sub: user.id, email: user.email }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    const refreshToken = uuidv4();

    await insertApiKey({
      userId: user.id,
      keyHash: refreshToken,
      is_refresh_token: true,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
      device_type: ua.device.type || 'desktop',
      platform: ua.os.name || 'unknown',
      browser: ua.browser.name || 'unknown',
      last_used: new Date(),
      last_used_ip: ip,
      last_used_user_agent: req.headers['user-agent'] || '',
    });

    return { token: accessToken, refreshToken };
  }

  static async refreshToken(req) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) throw new BadRequestError('refresh token required');

    const existing = await findApiKeyByUser(token);
    if (!existing || existing.status === false) {
      throw new InvalidRefreshTokenError();
    }

    const user = await findUserById(existing.user_id);
    if (!user) {
      throw new UnauthorizedError('user not found');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerError('JWT secret not configured');
    }

    const newAccessToken = jwt.sign(
      { sub: user.id, email: user.email },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
    );

    return { token: newAccessToken };
  }

  static async verifyToken(req) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) {
      throw new BadRequestError('No token provided');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerError('JWT secret not configured');
    }

    try {
      const payload = jwt.verify(token, secret);
      return payload;
    } catch (_err) {
      throw new UnauthorizedError('Invalid token');
    }
  }

  static async logout(req) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) {
      throw new BadRequestError('No token provided');
    }

    const decoded = jwt.decode(token);
    if (!decoded) {
      throw new UnauthorizedError('Invalid token');
    }

    await deleteApiKeyByKey(token); // Soft invalidate refresh token
    return true;
  }
}

module.exports = AuthService;