import AuthService from '../services/index.service.js';
import {
  SignupSuccess,
  LoginSuccess,
  InternalServerError,
  ErrorResponse
} from '../utils/httpResponses.js';
export default class AuthController {
  static async register(req, res) {
    const user = await AuthService.register(req.body);
    return new SignupSuccess({ metadata: user }).send(res);
  }
  static async login(req, res) {
    const result = await AuthService.login(req.body);
    return new LoginSuccess({ metadata: result }).send(res);
  }

  static async refresh(req, res) {
    const result = await AuthService.refresh(req.body);
    return new LoginSuccess({ metadata: result }).send(res
    );
  }
  static async logout(req, res) {
    try {
      await AuthService.logout(req.user.id);
      return res.status(204).send();
    } catch (error) {
      return new InternalServerError(error.message).send(res);
    }
  }

}