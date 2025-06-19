const ReportGroupService = require('../services/report_group.service.js');
const { CREATED, OK } = require('../utils/httpResponses.js');

class ReportGroupController {
  static async create(req, res) {
    const result = await ReportGroupService.create(req);
    return new CREATED({ metadata: result }).send(res);
  }

  static async update(req, res) {
    const result = await ReportGroupService.update(parseInt(req.params.id, 10), req.body);
    return new OK({ metadata: result }).send(res);
  }

  static async getByID(req, res) {
    const result = await ReportGroupService.getById(parseInt(req.params.id, 10));
    return new OK({ metadata: result }).send(res);
  }

  static async delete(req, res) {
    const result = await ReportGroupService.delete(parseInt(req.params.id, 10));
    return new OK({ metadata: result }).send(res);
  }
}

module.exports = ReportGroupController;
