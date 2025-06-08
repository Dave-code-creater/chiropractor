import { CREATED, OK, NotFoundError, InternalServerError, ErrorResponse } from '../utils/httpResponses.js';
import AppointmentService from '../services/index.service.js';

export default class TreatmentNoteController {
  static async create(req, res) {
    try {
      const note = await AppointmentService.createNote(req.body);
      return new CREATED({ metadata: note }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error creating note').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const note = await AppointmentService.getNote(Number(req.params.id));
      if (!note) return new NotFoundError('not found').send(res);
      return new OK({ metadata: note }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error fetching note').send(res);
    }
  }

  static async update(req, res) {
    try {
      const note = await AppointmentService.updateNote(
        Number(req.params.id),
        req.body
      );
      if (!note) return new NotFoundError('not found').send(res);
      return new OK({ metadata: note }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error updating note').send(res);
    }
  }
}
