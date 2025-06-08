import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, findUserByUsername } from '../repositories/index.repo.js';
import { SignupSuccess, LoginSuccess, ConflictRequestError, BadRequestError, UnauthorizedError, InternalServerError } from '../utils/httpResponses.js';

export default class AuthController {
  static async register(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
      return new BadRequestError('username and password required').send(res);
    }
    try {
      const existing = await findUserByUsername(username);
      if (existing) {
        return new ConflictRequestError('username taken').send(res);
      }
      const hash = await bcrypt.hash(password, 10);
      const user = await createUser(username, hash);
      return new SignupSuccess({ metadata: { id: user.id, username: user.username } }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error creating user').send(res);
    }
  }

  static async login(req, res) {
    const { username, password } = req.body;
    if (!username || !password) {
      return new BadRequestError('username and password required').send(res);
    }
    try {
      const user = await findUserByUsername(username);
      if (!user) {
        return new UnauthorizedError('invalid credentials').send(res);
      }
      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        return new UnauthorizedError('invalid credentials').send(res);
      }
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return new InternalServerError('JWT secret not configured').send(res);
      }
      const payload = { sub: user.id, username: user.username };
      const token = jwt.sign(payload, secret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      });
      return new LoginSuccess({ metadata: { token } }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('login error').send(res);
    }
  }
}
