const PatientIntakeService = require('../services/patientIntake.service.js');
const { CREATED, OK } = require('../utils/httpResponses');

class PatientIntakeController {
  static async create(req, res) {
    const result = await PatientIntakeService.create(req.body, req);
    return new CREATED({ metadata: result }).send(res);
  }

  static async getById(req, res) {
    const result = await PatientIntakeService.getById(req);
    return new OK({ metadata: result }).send(res);
  }

  static async update(req, res) {
    const result = await PatientIntakeService.update(req, req.body);
    return new OK({ metadata: result }).send(res);
  }
}

module.exports = PatientIntakeController;
