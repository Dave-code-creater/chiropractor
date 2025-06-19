const {
  createReport,
  getReportById,
  updateReport,
  listReports,
  listReportsByOwner,
  deleteReport,
} = require('../repositories/report.repo.js');
const {
  CREATED,
  OK,
  NotFoundError,
  InternalServerError,
} = require('../utils/httpResponses.js');

class ReportController {
  static async create(req, res) {
    try {
      const report = await createReport(req.body.owner_id, req.body.data);
      return new CREATED({ metadata: report }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error creating report').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const report = await getReportById(Number(req.params.id));
      if (!report) return new NotFoundError('not found').send(res);
      return new OK({ metadata: report }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching report').send(res);
    }
  }

  static async update(req, res) {
    try {
      const report = await updateReport(Number(req.params.id), req.body.data);
      if (!report) return new NotFoundError('not found').send(res);
      return new OK({ metadata: report }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error updating report').send(res);
    }
  }

  static async list(_req, res) {
    try {
      const reports = await listReports();
      return new OK({ metadata: reports }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error listing reports').send(res);
    }
  }

  static async listByOwner(req, res) {
    try {
      const reports = await listReportsByOwner(Number(req.params.ownerId));
      return new OK({ metadata: reports }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error listing reports').send(res);
    }
  }

  static async delete(req, res) {
    try {
      const report = await deleteReport(Number(req.params.id));
      if (!report) return new NotFoundError('not found').send(res);
      return new OK({ metadata: report }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error deleting report').send(res);
    }
  }
}

module.exports = ReportController;
