import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername } from '../repositories/index.repo.js';
import { BadRequestError, ConflictRequestError, UnauthorizedError, InternalServerError } from '../utils/httpResponses.js';

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

    const payload = { sub: user.id, username: user.username };
    const token = jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });
    return { token };
  }
    // Placeholder for user registration logic
    // This would typically involve validating input, checking for existing users,
    // hashing passwords, and saving the user to the database.
    return { success: true, message: 'User registered successfully', userData };
  }

  static async login(credentials) {
    // Placeholder for user login logic
    // This would typically involve validating credentials, checking against the database,
    // and generating a session or token.
    return { success: true, message: 'User logged in successfully', credentials };
  }

  static async refreshToken(token) {
    // Placeholder for token refresh logic
    // This would typically involve validating the token and issuing a new one.
    return { success: true, message: 'Token refreshed successfully', token };
  }

  static async logout(userId) {
    // Placeholder for user logout logic
    // This would typically involve invalidating the user's session or token.
    return { success: true, message: 'User logged out successfully', userId };
  }
}
