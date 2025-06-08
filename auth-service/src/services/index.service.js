import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername } from '../repositories/index.repo.js';
import {
  BadRequestError,
  ConflictRequestError,
  UnauthorizedError,
  InternalServerError
} from '../utils/httpResponses.js';

export default class AuthService {
  static async register(data) {
    const { username, email, password, role = 'patient', first_name, last_name } = data;
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
    return { id: user.id, username: user.username };
  }

  static async login(data) {
    const { username, password } = data;
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
}
