const ProfileService = require('../services/profile.service');
const {
  CREATED,
  OK
} = require('../utils/httpResponses');

class ProfileController {
  static async create(req, res) {
    const result = await ProfileService.create(req);
    return new CREATED({ metadata: result }).send(res);
  }

  static async update(req, res) {
    const result = await ProfileService.update(req.params.id, req.body);
    return new OK({ metadata: result }).send(res);
  }

  static async getByID(req, res) {
    const result = await ProfileService.getByID(req.params.id);
    return new OK({ metadata: result }).send(res);
  }

  static async delete(req, res) {
    const result = await ProfileService.delete(req.params.id);
    return new OK({ metadata: result }).send(res);
  }
}
module.exports = ProfileController;