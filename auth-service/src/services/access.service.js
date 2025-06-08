import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername } from '../repositories/index.repo.js';
import {
  BadRequestError,
  ConflictRequestError,
  UnauthorizedError,
  InternalServerError
} from '../utils/httpResponses.js';

export default class AccessService {
  static async signUp(req) {
    const { username, email, password, role = 'patient', first_name, last_name } = req.body;
    if (!username || !email || !password || !first_name || !last_name) {
      throw new BadRequestError('missing required fields');
    }

    const existing = await findUserByUsername(username);
    if (existing) {
      throw new ConflictRequestError('username taken');
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await createUser({
      username,
      email,
      password_hash: hash,
      role,
      first_name,
      last_name
    });

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerError('JWT secret not configured');
    }

    const token = jwt.sign({ sub: user.id, username: user.username }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });

    return { user: { id: user.id, username: user.username }, token };
  }

  static async signIn(req) {
    const { username, password } = req.body;
    if (!username || !password) {
      throw new BadRequestError('username and password required');
    }

    const user = await findUserByUsername(username);
    if (!user) {
      throw new UnauthorizedError('invalid credentials');
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw new UnauthorizedError('invalid credentials');
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerError('JWT secret not configured');
    }

    const token = jwt.sign({ sub: user.id, username: user.username }, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });
    return { token };
  }

  static async signOut(_req) {
    return {};
  }

  static async refresh(req) {
    const { token } = req.body;
    if (!token) {
      throw new BadRequestError('token required');
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new InternalServerError('JWT secret not configured');
    }

    try {
      const payload = jwt.verify(token, secret);
      const newToken = jwt.sign(
        { sub: payload.sub, username: payload.username },
        secret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
      );
      return { token: newToken };
    } catch (err) {
      throw new UnauthorizedError('invalid token');
    }
  }
}
