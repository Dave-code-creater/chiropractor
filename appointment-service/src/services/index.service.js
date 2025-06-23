const {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  listAppointments,
  listAppointmentsByPatient,
  listAppointmentsByDoctor,
  deleteAppointment,
} = require('../repositories/appointment.repo.js');

// Temporarily comment out inter-service communication to avoid import issues
// const ServiceClient = require('../../shared/service-client');
// const { services, endpoints } = require('../../shared/service-config');

class AppointmentService {
  constructor() {
    // Temporarily disable inter-service communication
    // this.userService = new ServiceClient(services.USER);
    // this.doctorService = new ServiceClient(services.DOCTOR);
    // this.chatService = new ServiceClient(services.CHAT);
  }

  async getPatientProfile(patientId, headers) {
    try {
      // Simplified patient profile - replace with actual implementation
      return {
        id: patientId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0123'
      };
    } catch (error) {
      console.error('Error fetching patient profile:', error);
      throw error;
    }
  }

  async createAppointment(appointmentData, headers) {
    try {
      // Simplified appointment creation
      const appointment = {
        id: Date.now(), // Simple ID generation
        doctorId: appointmentData.doctorId,
        patientId: appointmentData.patientId,
        datetime: appointmentData.datetime,
        duration: appointmentData.duration || 30,
        type: appointmentData.type || 'consultation',
        status: 'scheduled',
        doctorName: 'Dr. Smith', // Simplified
        patientName: 'John Doe' // Simplified
      };

      // TODO: Save appointment to database
      // Appointment created successfully

      return appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async getAppointmentWithDetails(appointmentId, headers) {
    try {
      // Simplified appointment details
      const appointment = {
        id: appointmentId,
        doctorId: 1,
        patientId: 1,
        datetime: new Date().toISOString(),
        duration: 30,
        type: 'consultation',
        status: 'scheduled'
      };

      return {
        ...appointment,
        doctor: { id: 1, name: 'Dr. Smith', specialization: 'Chiropractic' },
        patient: { id: 1, name: 'John Doe', email: 'john@example.com' }
      };
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      throw error;
    }
  }

  // Temporarily disabled complex methods
  /*
  isTimeSlotAvailable(requestedTime, availability) {
    const requestedDate = new Date(requestedTime);
    const day = requestedDate.toLocaleLowerCase();
    const time = requestedDate.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5);

    return availability.weeklySchedule[day]?.some(slot => {
      const [start, end] = slot.split('-');
      return time >= start && time <= end;
    });
  }

  async createAppointmentChannel(appointment, headers) {
    // TODO: Implement chat channel creation
          // Creating appointment channel
    return { id: 'channel-' + appointment.id };
  }

  async sendAppointmentNotifications(appointment, headers) {
    // TODO: Implement notification system
          // Sending appointment notifications
  }
  */

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

module.exports = new AppointmentService();
