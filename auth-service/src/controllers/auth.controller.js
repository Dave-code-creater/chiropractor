const AuthService = require('../services/index.service.js');
const {
  SignupSuccess,
  LoginSuccess,
  OK,
  InternalServerError,
  ErrorResponse
} = require('../utils/httpResponses.js');

class AuthController {
  static async register(req, res) {
    const user = await AuthService.register(req.body, req);
    return new SignupSuccess({ metadata: user }).send(res);
  }
  static async login(req, res) {
    const result = await AuthService.login(req.body, req);
    return new LoginSuccess({ metadata: result }).send(res);
  }

  static async refresh(req, res) {
    const result = await AuthService.refreshToken(req);
    return new LoginSuccess({ metadata: result }).send(res);
  }

  static async logout(req, res) {
    const result = await AuthService.logout(req);
    if (result) {
      return res.status(204).send();
    }
    return new InternalServerError('Logout failed').send(res);
  }

  static async verify(req, res) {
    const payload = await AuthService.verifyToken(req);
    return new OK({ metadata: payload }).send(res);
  }
}

module.exports = AuthController;
