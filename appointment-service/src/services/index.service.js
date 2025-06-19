const {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  listAppointments,
  listAppointmentsByPatient,
  listAppointmentsByDoctor,
  deleteAppointment,
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

  static async listAppointmentsByDoctor(doctorId) {
    return listAppointmentsByDoctor(doctorId);
  }

  static async deleteAppointment(id) {
    return deleteAppointment(id);
  }

  static async getUserProfile(userId) {
    const res = await fetch(`http://user-service:3002/profiles/${userId}`);
    if (!res.ok) throw new Error('failed to fetch profile');
    return res.json();
  }
}

module.exports = AppointmentService;
