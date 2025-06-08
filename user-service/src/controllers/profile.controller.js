import { CREATED, OK, NotFoundError, InternalServerError, ErrorResponse } from '../utils/httpResponses.js';
import UserService from '../services/index.service.js';

export default class ProfileController {
  static async create(req, res) {
    try {
      const profile = await UserService.createProfile(req.body);
      return new CREATED({ metadata: profile }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error creating profile').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const profile = await UserService.getProfile(Number(req.params.id));
      if (!profile) return new NotFoundError('not found').send(res);
      return new OK({ metadata: profile }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error fetching profile').send(res);
    }
  }

  static async update(req, res) {
    try {
      const profile = await UserService.updateProfile(Number(req.params.id), req.body);
      if (!profile) return new NotFoundError('not found').send(res);
      return new OK({ metadata: profile }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error updating profile').send(res);
    }
  }
}
