import AuthService from '../services/index.service.js';
import {
  SignupSuccess,
  LoginSuccess,
} from '../utils/httpResponses.js';
export default class AuthController {
  static async register(req, res) {
    const user = await AuthService.register(req.body);
    return new SignupSuccess({ metadata: user }).send(res);
  }
    const result = await AuthService.login(req.body);
    return new LoginSuccess({ metadata: result }).send(res);
  }

  static async logout(req, res) {
    // Placeholder for logout logic
    // Typically, this would involve invalidating the JWT or session
    return res.status(200).json({ message: 'Logged out successfully' });
  }

  static async refreshToken(req, res) {
    // Placeholder for token refresh logic
    // This would typically involve issuing a new JWT based on the old one
    return res.status(200).json({ message: 'Token refreshed successfully' });

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