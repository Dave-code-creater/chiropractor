const {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  listAppointments,
} = require('../repositories/appointment.repo.js');
const {
  CREATED,
  OK,
  NotFoundError,
  InternalServerError,
} = require('../utils/httpResponses.js');

class AppointmentController {
  static async create(req, res) {
    try {
      const appt = await createAppointment(req.body);
      return new CREATED({ metadata: appt }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error creating appointment').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const appt = await getAppointmentById(Number(req.params.id));
      if (!appt) return new NotFoundError('not found').send(res);
      return new OK({ metadata: appt }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching appointment').send(res);
    }
  }

  static async update(req, res) {
    try {
      const appt = await updateAppointment(Number(req.params.id), req.body);
      if (!appt) return new NotFoundError('not found').send(res);
      return new OK({ metadata: appt }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error updating appointment').send(res);
    }
  }

  static async list(_req, res) {
    try {
      const appts = await listAppointments();
      return new OK({ metadata: appts }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error listing appointments').send(res);
    }
  }
}

module.exports = AppointmentController;
