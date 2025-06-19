const {
  createReport,
  getReportById,
  updateReport,
  listReports,
  deleteReport,
} = require('../repositories/report.repo.js');
const { publish } = require('../utils/messageBroker.js');

class ReportService {
  static async create(ownerId, data) {
    const report = await createReport(ownerId, data);
    await publish('reports.created', report);
    return report;
  }

  static async getById(id) {
    return getReportById(id);
  }

  static async update(id, data) {
    const report = await updateReport(id, data);
    if (report) await publish('reports.updated', report);
    return report;
  }

  static async list() {
    return listReports();
  }

  static async delete(id) {
    const report = await deleteReport(id);
    if (report) await publish('reports.deleted', report);
    return report;
  }
}

module.exports = ReportService;

