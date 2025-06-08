import { CREATED, OK, NotFoundError, InternalServerError, ErrorResponse } from '../utils/httpResponses.js';
import UserService from '../services/index.service.js';

export default class EmergencyContactController {
  static async create(req, res) {
    try {
      const contact = await UserService.createEmergencyContact(req.body);
      return new CREATED({ metadata: contact }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error creating contact').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const contact = await UserService.getEmergencyContact(Number(req.params.id));
      if (!contact) return new NotFoundError('not found').send(res);
      return new OK({ metadata: contact }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error fetching contact').send(res);
    }
  }

  static async update(req, res) {
    try {
      const contact = await UserService.updateEmergencyContact(
        Number(req.params.id),
        req.body
      );
      if (!contact) return new NotFoundError('not found').send(res);
      return new OK({ metadata: contact }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error updating contact').send(res);
    }
  }
}
