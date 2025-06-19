const reportRepo = require('../repositories/report.repo.js');
const {
  CREATED,
  OK,
  NotFoundError,
  InternalServerError,
} = require('../utils/httpResponses.js');

class ReportController {
  static async create(req, res) {
    try {
      const report = await reportRepo.createReport(
        req.body.owner_id,
        req.body.data
      );
      return new CREATED({ metadata: report }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error creating report').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const report = await reportRepo.getReportById(Number(req.params.id));
      if (!report) return new NotFoundError('not found').send(res);
      return new OK({ metadata: report }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching report').send(res);
    }
  }

  static async update(req, res) {
    try {
      const report = await reportRepo.updateReport(
        Number(req.params.id),
        req.body.data
      );
      if (!report) return new NotFoundError('not found').send(res);
      return new OK({ metadata: report }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error updating report').send(res);
    }
  }

  static async list(_req, res) {
    try {
      const reports = await reportRepo.listReports();
      return new OK({ metadata: reports }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error listing reports').send(res);
    }
  }
}

module.exports = ReportController;
