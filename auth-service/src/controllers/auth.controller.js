'use strict';
import {
  SignupSuccess,
  LoginSuccess,
  TokenRefreshed,
  LogoutSuccess,
  InternalServerError,
  ErrorResponse
} from '../utils/httpResponses.js';
import AccessService from '../services/access.service.js';
class AccessController {
  signUp = async (req, res) => {
      const result = await AccessService.signUp(req);
      new SignupSuccess({ metadata: result }).send(res);
      new InternalServerError('error creating user').send(res);
  };
  signIn = async (req, res) => {
      const result = await AccessService.signIn(req);
      new LoginSuccess({ metadata: result }).send(res);
      new InternalServerError('login error').send(res);
  };

  signOut = async (req, res) => {
    try {
      await AccessService.signOut(req);
      new LogoutSuccess().send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      new InternalServerError('logout error').send(res);
    }
  };

  refresh = async (req, res) => {
    try {
      const result = await AccessService.refresh(req);
      new TokenRefreshed({ metadata: result }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      new InternalServerError('refresh error').send(res);
    }
  };

export default new AccessController();
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