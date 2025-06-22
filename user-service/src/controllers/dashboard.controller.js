const DashboardService = require('../services/dashboard.service.js');
const { OK, InternalServerError } = require('../utils/httpResponses.js');

class DashboardController {
  static async getDashboardStats(req, res) {
    try {
      const stats = await DashboardService.getDashboardStats();
      return new OK({ metadata: stats }).send(res);
    } catch (error) {
      return new InternalServerError(error.message).send(res);
    }
  }

  static async getAppointmentStats(req, res) {
    try {
      const { date } = req.query;
      const stats = await DashboardService.getAppointmentStats(date);
      return new OK({ metadata: stats }).send(res);
    } catch (error) {
      return new InternalServerError(error.message).send(res);
    }
  }

  static async getAppointmentReports(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const reports = await DashboardService.getAppointmentReports(startDate, endDate);
      return new OK({ metadata: reports }).send(res);
    } catch (error) {
      return new InternalServerError(error.message).send(res);
    }
  }

  static async getPatientReports(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const reports = await DashboardService.getPatientReports(startDate, endDate);
      return new OK({ metadata: reports }).send(res);
    } catch (error) {
      return new InternalServerError(error.message).send(res);
    }
  }
}

module.exports = DashboardController; 