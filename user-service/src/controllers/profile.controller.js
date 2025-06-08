import { createProfile, getProfileById, updateProfile } from '../repositories/index.repo.js';
import { CREATED, OK, NotFoundError, InternalServerError } from '../utils/httpResponses.js';

export default class ProfileController {
  static async create(req, res) {
    try {
      const profile = await createProfile(req.body);
      return new CREATED({ metadata: profile }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error creating profile').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const profile = await getProfileById(Number(req.params.id));
      if (!profile) return new NotFoundError('not found').send(res);
      return new OK({ metadata: profile }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching profile').send(res);
    }
  }

  static async update(req, res) {
    try {
      const profile = await updateProfile(Number(req.params.id), req.body);
      if (!profile) return new NotFoundError('not found').send(res);
      return new OK({ metadata: profile }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error updating profile').send(res);
    }
  }
}
