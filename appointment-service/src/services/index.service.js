const {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  listAppointments,
  listAppointmentsByPatient,
} = require('../repositories/appointment.repo.js');


class AppointmentService {
  static async createAppointment(data) {
    return createAppointment(data);
  }

  static async getAppointment(id) {
    return getAppointmentById(id);
  }

  static async updateAppointment(id, data) {
    return updateAppointment(id, data);
  }

  static async listAppointments() {
    return listAppointments();
  }

  static async listAppointmentsByPatient(patientId) {
    return listAppointmentsByPatient(patientId);
  }
}

module.exports = AppointmentService;
