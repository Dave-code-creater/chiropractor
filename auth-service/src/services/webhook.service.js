const axios = require('axios');

class WebhookService {
  /**
   * Notify chat service when a new user is registered
   */
  static async notifyChatServiceUserRegistered(userData) {
    try {
      const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://chat-service:3004';
      
      const payload = {
        userId: userData.id,
        email: userData.email,
        firstName: userData.firstName || userData.first_name || 'User',
        lastName: userData.lastName || userData.last_name || '',
        role: userData.role,
        specialization: userData.specialization,
        licenseNumber: userData.licenseNumber,
        department: userData.department,
        position: userData.position,
        dateOfBirth: userData.dateOfBirth,
        phone: userData.phone,
        profileImage: userData.profileImage
      };

      console.log(`📡 Notifying chat service of new user registration: ${userData.email}`);
      
      const response = await axios.post(
        `${chatServiceUrl}/users/auto-register`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Source': 'auth-service'
          },
          timeout: 5000 // 5 second timeout
        }
      );

      if (response.status === 201) {
        console.log(`✅ Successfully notified chat service for user: ${userData.email}`);
      } else {
        console.warn(`⚠️ Unexpected response from chat service: ${response.status}`);
      }

      return response.data;
    } catch (error) {
      console.error(`❌ Failed to notify chat service for user ${userData.email}:`, error.message);
      
      // Don't throw error - user registration should not fail if chat service is down
      // Just log the error and continue
      return null;
    }
  }

  /**
   * Notify chat service when user profile is updated
   */
  static async notifyChatServiceUserUpdated(userData) {
    try {
      const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://chat-service:3004';
      
      const payload = {
        userId: userData.id,
        email: userData.email,
        firstName: userData.firstName || userData.first_name,
        lastName: userData.lastName || userData.last_name,
        profileImage: userData.profileImage,
        phone: userData.phone
      };

      console.log(`📡 Notifying chat service of user profile update: ${userData.email}`);
      
      const response = await axios.put(
        `${chatServiceUrl}/users/profile-update`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Source': 'auth-service'
          },
          timeout: 5000
        }
      );

      console.log(`✅ Successfully notified chat service of profile update for: ${userData.email}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to notify chat service of profile update for ${userData.email}:`, error.message);
      return null;
    }
  }

  /**
   * Notify appointment service when appointment is created (for chat integration)
   */
  static async notifyAppointmentChatCreation(appointmentData) {
    try {
      const chatServiceUrl = process.env.CHAT_SERVICE_URL || 'http://chat-service:3004';
      
      const payload = {
        appointmentId: appointmentData.id,
        doctorId: appointmentData.doctor_id,
        patientId: appointmentData.user_id,
        scheduledAt: appointmentData.scheduled_at,
        type: 'appointment'
      };

      console.log(`📡 Creating appointment chat for appointment: ${appointmentData.id}`);
      
      const response = await axios.post(
        `${chatServiceUrl}/api/conversations/appointment`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Webhook-Source': 'appointment-service'
          },
          timeout: 5000
        }
      );

      console.log(`✅ Successfully created appointment chat for appointment: ${appointmentData.id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Failed to create appointment chat for appointment ${appointmentData.id}:`, error.message);
      return null;
    }
  }
}

module.exports = WebhookService; 