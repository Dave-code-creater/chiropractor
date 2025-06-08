import { CREATED, OK, NotFoundError, InternalServerError, ErrorResponse } from '../utils/httpResponses.js';
import ReportService from '../services/index.service.js';

export default class ReportController {
  static async create(req, res) {
    try {
      const report = await ReportService.create(req.body.owner_id, req.body.data);
      return new CREATED({ metadata: report }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error creating report').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const report = await ReportService.getById(Number(req.params.id));
      if (!report) return new NotFoundError('not found').send(res);
      return new OK({ metadata: report }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error fetching report').send(res);
    }
  }

  static async update(req, res) {
    try {
      const report = await ReportService.update(Number(req.params.id), req.body.data);
      if (!report) return new NotFoundError('not found').send(res);
      return new OK({ metadata: report }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error updating report').send(res);
    }
  }

  static async list(_req, res) {
    try {
      const reports = await ReportService.list();
      return new OK({ metadata: reports }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error listing reports').send(res);
    }
  }
}
