import { CREATED, OK, NotFoundError, InternalServerError, ErrorResponse } from '../utils/httpResponses.js';
import UserService from '../services/index.service.js';

export default class InsuranceDetailController {
  static async create(req, res) {
    try {
      const detail = await UserService.createInsuranceDetail(req.body);
      return new CREATED({ metadata: detail }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error creating detail').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const detail = await UserService.getInsuranceDetail(Number(req.params.id));
      if (!detail) return new NotFoundError('not found').send(res);
      return new OK({ metadata: detail }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error fetching detail').send(res);
    }
  }

  static async update(req, res) {
    try {
      const detail = await UserService.updateInsuranceDetail(
        Number(req.params.id),
        req.body
      );
      if (!detail) return new NotFoundError('not found').send(res);
      return new OK({ metadata: detail }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error updating detail').send(res);
    }
  }
}
