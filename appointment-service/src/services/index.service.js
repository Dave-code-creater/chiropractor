const {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  listAppointments,
  listAppointmentsByPatient,
  listAppointmentsByDoctor,
  deleteAppointment,
} = require('../repositories/appointment.repo.js');
const AuthClient = require('./auth.service.js');
const { publish } = require('../utils/messageBroker.js');


class AppointmentService {
  static async createAppointment(data) {
    if (data.doctor_id) {
      await AuthClient.getUser(data.doctor_id);
    }
    const appt = await createAppointment(data);
    await publish('appointments.created', appt);
    return appt;
  }

  static async getAppointment(id) {
    return getAppointmentById(id);
  }

  static async updateAppointment(id, data) {
    const appt = await updateAppointment(id, data);
    if (appt) await publish('appointments.updated', appt);
    return appt;
  }

  static async listAppointments() {
    return listAppointments();
  }

  static async listAppointmentsByPatient(patientId) {
    return listAppointmentsByPatient(patientId);
  }

  static async listAppointmentsByDoctor(doctorId) {
    return listAppointmentsByDoctor(doctorId);
  }

  static async deleteAppointment(id) {
    const appt = await deleteAppointment(id);
    if (appt) await publish('appointments.deleted', appt);
    return appt;
  }
}

module.exports = AppointmentService;
