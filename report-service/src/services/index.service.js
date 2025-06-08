import {
  createReport,
  getReportById,
  updateReport,
  listReports
} from '../repositories/index.repo.js';

export default class ReportService {
  static async create(ownerId, data) {
    return createReport(ownerId, data);
  }

  static async getById(id) {
    return getReportById(id);
  }

  static async update(id, data) {
    return updateReport(id, data);
  }

  static async list() {
    return listReports();
  }
}
