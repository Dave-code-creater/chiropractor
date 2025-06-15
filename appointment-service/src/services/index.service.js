const {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  listAppointments,
  listAppointmentsByPatient,
} = require('../repositories/appointment.repo.js');

const {
  createTreatmentNote,
  getTreatmentNoteById,
  updateTreatmentNote,
} = require('../repositories/note.repo.js');

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

  static async createNote(data) {
    return createTreatmentNote(data);
  }

  static async getNote(id) {
    return getTreatmentNoteById(id);
  }

  static async updateNote(id, data) {
    return updateTreatmentNote(id, data);
  }
}

module.exports = AppointmentService;
