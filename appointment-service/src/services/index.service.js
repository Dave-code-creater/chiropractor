const {
  createAppointment,
  getAppointmentById,
  updateAppointment,
  listAppointments,
  listAppointmentsByPatient,
  listAppointmentsByDoctor,
  deleteAppointment,
} = require('../repositories/appointment.repo.js');

const ServiceClient = require('../../shared/service-client');
const { services, endpoints } = require('../../shared/service-config');

class AppointmentService {
  constructor() {
    this.userService = new ServiceClient(services.USER);
    this.doctorService = new ServiceClient(services.DOCTOR);
    this.chatService = new ServiceClient(services.CHAT);
  }

  async getPatientProfile(patientId, headers) {
    try {
      // Forward the original request headers for authentication
      const profile = await this.userService.forward(
        `${endpoints.USER.PROFILE}/${patientId}`,
        headers
      );
      return profile;
    } catch (error) {
      console.error('Error fetching patient profile:', error);
      throw error;
    }
  }

  async createAppointment(appointmentData, headers) {
    try {
      // Verify doctor's availability
      const availability = await this.doctorService.forward(
        endpoints.DOCTOR.AVAILABILITY(appointmentData.doctorId),
        headers
      );

      // Check if the requested time slot is available
      if (!this.isTimeSlotAvailable(appointmentData.datetime, availability)) {
        throw new Error('Selected time slot is not available');
      }

      // Get doctor's profile
      const doctorProfile = await this.doctorService.forward(
        `${endpoints.DOCTOR.PROFILE}/${appointmentData.doctorId}`,
        headers
      );

      // Get patient's profile
      const patientProfile = await this.userService.forward(
        `${endpoints.USER.PROFILE}/${appointmentData.patientId}`,
        headers
      );

      // Create the appointment
      const appointment = {
        doctorId: appointmentData.doctorId,
        patientId: appointmentData.patientId,
        datetime: appointmentData.datetime,
        duration: appointmentData.duration || 30, // default 30 minutes
        type: appointmentData.type,
        status: 'scheduled',
        doctorName: `${doctorProfile.firstName} ${doctorProfile.lastName}`,
        patientName: `${patientProfile.firstName} ${patientProfile.lastName}`
      };

      // Save appointment to database
      // Your database save logic here

      // Create a chat channel for the appointment
      await this.createAppointmentChannel(appointment, headers);

      // Send notifications
      await this.sendAppointmentNotifications(appointment, headers);

      return appointment;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  async getAppointmentWithDetails(appointmentId, headers) {
    try {
      // Get basic appointment details
      const appointment = {}; // Your appointment fetch logic here

      // Get doctor's profile with availability and specializations
      const doctorProfile = await this.doctorService.forward(
        `${endpoints.DOCTOR.PROFILE}/${appointment.doctorId}`,
        headers
      );

      // Get patient's profile with relevant medical history
      const patientProfile = await this.userService.forward(
        `${endpoints.USER.PROFILE}/${appointment.patientId}`,
        headers
      );

      return {
        ...appointment,
        doctor: doctorProfile,
        patient: patientProfile
      };
    } catch (error) {
      console.error('Error fetching appointment details:', error);
      throw error;
    }
  }

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
    try {
      // Create a private channel for the appointment
      const channel = await this.chatService.forward(
        endpoints.CHAT.CHANNELS,
        headers,
        {
          method: 'POST',
          data: {
            name: `appointment-${appointment.id}`,
            members: [appointment.doctorId, appointment.patientId],
            type: 'appointment',
            metadata: {
              appointmentId: appointment.id,
              datetime: appointment.datetime
            }
          }
        }
      );

      // Send welcome message
      await this.chatService.forward(
        endpoints.CHAT.MESSAGES,
        headers,
        {
          method: 'POST',
          data: {
            channelId: channel.id,
            content: `Welcome to your appointment channel! Your appointment is scheduled for ${new Date(appointment.datetime).toLocaleString()}`,
            type: 'system'
          }
        }
      );

      return channel;
    } catch (error) {
      console.error('Error creating appointment channel:', error);
      throw error;
    }
  }

  async sendAppointmentNotifications(appointment, headers) {
    try {
      // Send notification to doctor
      await this.chatService.forward(
        endpoints.CHAT.MESSAGES,
        headers,
        {
          method: 'POST',
          data: {
            userId: appointment.doctorId,
            content: `New appointment scheduled with ${appointment.patientName} for ${new Date(appointment.datetime).toLocaleString()}`,
            type: 'notification'
          }
        }
      );

      // Send notification to patient
      await this.chatService.forward(
        endpoints.CHAT.MESSAGES,
        headers,
        {
          method: 'POST',
          data: {
            userId: appointment.patientId,
            content: `Your appointment with Dr. ${appointment.doctorName} is confirmed for ${new Date(appointment.datetime).toLocaleString()}`,
            type: 'notification'
          }
        }
      );
    } catch (error) {
      console.error('Error sending appointment notifications:', error);
      throw error;
    }
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

module.exports = new AppointmentService();
