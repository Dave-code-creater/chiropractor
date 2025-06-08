// controllers/auth.controller.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  createUser,
  findUserByEmail,
  findUserByUsername
} from '../repositories/index.repo.js';
import {
  insertApiKey,
  findApiKeyByUser
} from '../repositories/apiKey.repo.js';
import {
  SignupSuccess,
  LoginSuccess,
  ConflictRequestError,
  BadRequestError,
  UnauthorizedError,
  InternalServerError
} from '../utils/httpResponses.js';
import authValidator from '../../validators/auth.validators.js';
import { generateApiKey, hashApiKey } from '../utils/api_key.js';

export default class AuthController {
  static async register(req, res) {
    const {
      email,
      password,
      confirm_password,
      role = 'patient',
      first_name,
      last_name,
      phone_number
    } = req.body;

    const { error } = authValidator.register.validate(req.body);
    if (error) {
      return new BadRequestError(error.details[0].message).send(res);
    }

    try {
      // check email
      if (await findUserByEmail(email)) {
        return new ConflictRequestError('email or email already taken').send(res);
      }

      // create user
      const hash = await bcrypt.hash(password, 10);
      const user = await createUser({
        email,
        password_hash: hash,
        role,
        first_name,
        last_name,
        phone_number
      });

      // generate & store API key
      const rawApiKey = generateApiKey();
      const apiKeyHash = hashApiKey(rawApiKey);
      await insertApiKey({ userId: user.id, keyHash: apiKeyHash });

      return new SignupSuccess({
        metadata: {
          id: user.id,
          username: user.username,
          api_key: rawApiKey       // return plaintext exactly once
        }
      }).send(res);

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

      // issue JWT
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return new InternalServerError('JWT secret not configured').send(res);
      }
      const payload = { sub: user.id, username: user.username, role: user.role };
      const token = jwt.sign(payload, secret, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h'
      });

      // fetch existing API key or generate a new one
      let apiKeyRec = await findApiKeyByUser(user.id);
      let rawApiKey = null;
      if (!apiKeyRec) {
        rawApiKey = generateApiKey();
        const apiKeyHash = hashApiKey(rawApiKey);
        await insertApiKey({ userId: user.id, keyHash: apiKeyHash });
      }

      return new LoginSuccess({
        metadata: {
          token,
          api_key: rawApiKey   // if null, client already has theirs
        }
      }).send(res);

    } catch (err) {
      console.error(err);
      return new InternalServerError('login error').send(res);
    }
  }
}