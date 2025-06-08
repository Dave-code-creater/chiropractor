import { CREATED, OK, NotFoundError, InternalServerError, ErrorResponse } from '../utils/httpResponses.js';
import AppointmentService from '../services/index.service.js';

export default class AppointmentController {
  static async create(req, res) {
    try {
      const appt = await AppointmentService.createAppointment(req.body);
      return new CREATED({ metadata: appt }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error creating appointment').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const appt = await AppointmentService.getAppointment(Number(req.params.id));
      if (!appt) return new NotFoundError('not found').send(res);
      return new OK({ metadata: appt }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error fetching appointment').send(res);
    }
  }

  static async update(req, res) {
    try {
      const appt = await AppointmentService.updateAppointment(
        Number(req.params.id),
        req.body
      );
      if (!appt) return new NotFoundError('not found').send(res);
      return new OK({ metadata: appt }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error updating appointment').send(res);
    }
  }

  static async list(_req, res) {
    try {
      const appts = await AppointmentService.listAppointments();
      return new OK({ metadata: appts }).send(res);
    } catch (err) {
      console.error(err);
      if (err instanceof ErrorResponse) return err.send(res);
      return new InternalServerError('error listing appointments').send(res);
    }
  }
}
