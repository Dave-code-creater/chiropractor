const ProfileService = require('../services/profile.service.js');
const { getProfileById } = require('../repositories/profile.repo.js');
const {
  CREATED,
  OK,
  NotFoundError,
  InternalServerError,
} = require('../utils/httpResponses.js');

class ProfileController {
  static async create(req, res) {
    try {
      const data = await ProfileService.create(req);
      return new CREATED({ metadata: data }).send(res);
    } catch (err) {
      console.error(err);
      if (err.send) return err.send(res);
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
      const profile = await ProfileService.update(
        Number(req.params.id),
        req.body,
        req.user
      );
      if (!profile) return new NotFoundError('not found').send(res);
      return new OK({ metadata: profile }).send(res);
    } catch (err) {
      console.error(err);
      if (err.send) return err.send(res);
      return new InternalServerError('error updating profile').send(res);
    }
  }
}

module.exports = ProfileController;
