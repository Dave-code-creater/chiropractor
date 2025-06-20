const RecoveryService = require('../services/recovery.service.js');
const { CREATED, OK } = require('../utils/httpResponses.js');

class RecoveryController {
  static async create(req, res) {
    const result = await RecoveryService.create(req.body, req);
    return new CREATED({ metadata: result }).send(res);
  }

  static async update(req, res) {
    const result = await RecoveryService.update(req, req.body);
    return new OK({ metadata: result }).send(res);
  }

  static async getByID(req, res) {
    const result = await RecoveryService.getById(req);
    return new OK({ metadata: result }).send(res);
  }

  static async list(req, res) {
    const result = await RecoveryService.list(req);
    return new OK({ metadata: result }).send(res);
  }

  static async delete(req, res) {
    const result = await RecoveryService.delete(req);
    return new OK({ metadata: result }).send(res);
  }
}

module.exports = RecoveryController;
