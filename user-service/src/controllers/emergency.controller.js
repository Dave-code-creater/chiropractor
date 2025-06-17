const EmergencyService = require('../services/emergency.service.js');
const {
  CREATED,
  OK
} = require('../utils/httpResponses.js');

class EmergencyContactController {

  static async create(req, res) {
    const result = await EmergencyService.create(req.body, req);
    return new CREATED({ metadata: result }).send(res);
  }
  static async update(req, res) {
    const result = await EmergencyService.update(req, req.body);
    return new OK({ metadata: result }).send(res);
  }

  static async getByID(req, res) {
    const result = await EmergencyService.getByID(req);
    return new OK({ metadata: result }).send(res);
  }
  static async delete(req, res) {
    const result = await EmergencyService.delete(req);
    return new OK({ metadata: result }).send(res);
  }
}

module.exports = EmergencyContactController;
