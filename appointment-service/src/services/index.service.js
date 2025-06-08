import {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  listAppointments,
  createTreatmentNote,
  getTreatmentNoteById,
  updateTreatmentNote
} from '../repositories/index.repo.js';

export default class AppointmentService {
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
