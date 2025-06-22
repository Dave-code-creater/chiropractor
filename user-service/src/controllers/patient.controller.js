const PatientService = require('../services/patient.service.js');
const { OK, Created, InternalServerError } = require('../utils/httpResponses.js');

class PatientController {
  static async getAllPatients(req, res) {
    try {
      const { search, status, page = 1, limit = 10 } = req.query;
      const patients = await PatientService.getAllPatients({ search, status, page, limit });
      return new OK({ metadata: patients }).send(res);
    } catch (error) {
      return new InternalServerError(error.message).send(res);
    }
  }

  static async getPatientById(req, res) {
    try {
      const { id } = req.params;
      const patient = await PatientService.getPatientById(id);
      return new OK({ metadata: patient }).send(res);
    } catch (error) {
      return new InternalServerError(error.message).send(res);
    }
  }

  static async createPatient(req, res) {
    try {
      const patient = await PatientService.createPatient(req.body);
      return new Created({ metadata: patient }).send(res);
    } catch (error) {
      return new InternalServerError(error.message).send(res);
    }
  }

  static async updatePatient(req, res) {
    try {
      const { id } = req.params;
      const patient = await PatientService.updatePatient(id, req.body);
      return new OK({ metadata: patient }).send(res);
    } catch (error) {
      return new InternalServerError(error.message).send(res);
    }
  }

  static async getPatientStats(req, res) {
    try {
      const stats = await PatientService.getPatientStats();
      return new OK({ metadata: stats }).send(res);
    } catch (error) {
      return new InternalServerError(error.message).send(res);
    }
  }

  static async getPatientMedicalHistory(req, res) {
    try {
      const { id } = req.params;
      const history = await PatientService.getPatientMedicalHistory(id);
      return new OK({ metadata: history }).send(res);
    } catch (error) {
      return new InternalServerError(error.message).send(res);
    }
  }

  static async getInitialReport(req, res) {
    try {
      const userId = req.user.sub;
      const report = await PatientService.getInitialReport(userId);
      return new OK({ metadata: report }).send(res);
    } catch (error) {
      return new InternalServerError(error.message).send(res);
    }
  }
}

module.exports = PatientController; 