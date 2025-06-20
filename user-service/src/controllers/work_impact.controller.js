const WorkImpactService = require('../services/work_impact.service.js');
const { CREATED, OK } = require('../utils/httpResponses.js');

class WorkImpactController {
  static async create(req, res) {
    const result = await WorkImpactService.create(req.body, req);
    return new CREATED({ metadata: result }).send(res);
  }

  static async update(req, res) {
    const result = await WorkImpactService.update(req, req.body);
    return new OK({ metadata: result }).send(res);
  }

  static async getByID(req, res) {
    const result = await WorkImpactService.getById(req);
    return new OK({ metadata: result }).send(res);
  }

  static async list(req, res) {
    const result = await WorkImpactService.list(req);
    return new OK({ metadata: result }).send(res);
  }

  static async delete(req, res) {
    const result = await WorkImpactService.delete(req);
    return new OK({ metadata: result }).send(res);
  }
}

module.exports = WorkImpactController;
