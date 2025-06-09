const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const {
  createUser,
  findUserByUsername,
  findUserByEmail
} = require('../repositories/user.repo.js');
const {
  BadRequestError,
  ConflictRequestError,
  UnauthorizedError,
  InvalidRefreshTokenError,
  InternalServerError
} = require('../utils/httpResponses.js');
const { signUpValidator, signInValidator } = require('../validators/access.js');

class AuthService {
  static async register(data) {
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
      first_name,
      last_name
    });
    return { id: user.id, username: user.username };
  }

  static async login(data) {
    const { error } = signInValidator.validate(data);
    if (error) {
      throw new BadRequestError(error.details[0].message, '4002');
    }

    const { username, password } = data;

    const user = await findUserByUsername(username);
    if (!user) {
      throw new UnauthorizedError('invalid credentials', '4011');
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw new UnauthorizedError('invalid credentials', '4012');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerError('JWT secret not configured', '5001');
    }

    const token = jwt.sign(
      { sub: user.id, username: user.username },
      secret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      }
    );

    return { token };
  }

  static async refreshToken({ token }) {
    if (!token) throw new BadRequestError('refresh token required');

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerError('JWT secret not configured');
    }

    let payload;
    try {
      payload = jwt.verify(token, secret);
    } catch (err) {
      throw new InvalidRefreshTokenError();
    }

    const newToken = jwt.sign(
      { sub: payload.sub, username: payload.username },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );
    return { token: newToken };
  }

  static async logout() {
    return true;
  }
}

module.exports = AuthService;
