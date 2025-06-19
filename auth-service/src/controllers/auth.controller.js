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

  static async forgotPassword(req, res) {
    const result = await AuthService.forgotPassword(req.body);
    return new OK({ metadata: result }).send(res);
  }

  static async getUser(req, res) {
    const user = await AuthService.getUser(Number(req.params.id));
    if (!user) {
      return new ErrorResponse('user not found', 404).send(res);
    }
    return new OK({ metadata: user }).send(res);
  }

  static async updateUser(req, res) {
    const updated = await AuthService.updateUser(Number(req.params.id), req.body);
    if (!updated) {
      return new ErrorResponse('user not found', 404).send(res);
    }
    return new OK({ metadata: updated }).send(res);
  }

  static async deleteUser(req, res) {
    const deleted = await AuthService.deleteUser(Number(req.params.id));
    if (!deleted) {
      return new ErrorResponse('user not found', 404).send(res);
    }
    return new OK({ metadata: deleted }).send(res);
  }
}

module.exports = AuthController;
