const InsuranceService = require('../services/insurance.service');
const {
  CREATED,
  OK
} = require('../utils/httpResponses');

class InsuranceController {
  static async create(req, res) {
    const result = await InsuranceService.create(req.body, req);
    return new CREATED({ metadata: result }).send(res);
  }

  static async update(req, res) {
    const result = await InsuranceService.update(req, req.body);
    return new OK({ metadata: result }).send(res);
  }

  static async getByID(req, res) {
    const result = await InsuranceService.getByID(req);
    return new OK({ metadata: result }).send(res);
  }

  static async delete(req, res) {
    const result = await InsuranceService.delete(req);
    return new OK({ metadata: result }).send(res);
  }
}
module.exports = InsuranceController;