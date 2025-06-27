const UserService = require('../services/user.service.js');
const { OK, CREATED, NotFoundError, InternalServerError, BadRequestError } = require('../utils/httpResponses.js');
const http = require('http');



class UserController {
  /**
   * Auto-register user webhook endpoint
   * Called by auth service when new accounts are created
   */
  static async autoRegister(req, res) {
    try {
      const userData = req.body;
      
      // Validate required fields
      if (!userData.userId || !userData.email || !userData.role) {
        return new BadRequestError('Missing required fields: userId, email, role').send(res);
      }

      const chatUser = await UserService.autoRegisterUser(userData);
      
      return new CREATED({ 
        metadata: chatUser,
        message: `Chat user auto-registered successfully`
      }).send(res);
    } catch (error) {
      console.error('Auto-registration error:', error);
      return new InternalServerError('Failed to auto-register chat user').send(res);
    }
  }

  /**
   * Update user profile
   */
  static async updateProfile(req, res) {
    try {
      const userId = req.user.sub; // From JWT
      const updateData = req.body;

      const user = await UserService.updateUserProfile(userId, updateData);
      
      return new OK({ 
        metadata: user,
        message: 'Profile updated successfully'
      }).send(res);
    } catch (error) {
      console.error('Profile update error:', error);
      return new InternalServerError('Failed to update profile').send(res);
    }
  }

  /**
   * Get current user profile
   */
  static async getProfile(req, res) {
    try {
      const userId = req.user.sub;
      
      const user = await UserService.getUserByUserId(userId);
      if (!user) {
        return new NotFoundError('Chat user not found').send(res);
      }

      return new OK({ metadata: user }).send(res);
    } catch (error) {
      console.error('Get profile error:', error);
      return new InternalServerError('Failed to fetch profile').send(res);
    }
  }

  /**
   * Set online status
   */
  static async setOnlineStatus(req, res) {
    try {
      const userId = req.user.sub;
      const { isOnline } = req.body;

      const user = await UserService.setUserOnlineStatus(userId, isOnline);
      
      return new OK({ 
        metadata: { isOnline: user.isOnline, lastSeen: user.lastSeen }
      }).send(res);
    } catch (error) {
      console.error('Set online status error:', error);
      return new InternalServerError('Failed to update online status').send(res);
    }
  }

  /**
   * Get all doctors (for patients to chat with)
   */
  static async getDoctors(req, res) {
    try {
      // Fetch doctors directly from appointment service instead of duplicating data
      const appointmentServiceUrl = process.env.APPOINTMENT_SERVICE_URL || 'appointment-service:3005';
      
      const data = await new Promise((resolve, reject) => {
        const options = {
          hostname: appointmentServiceUrl.split(':')[0],
          port: appointmentServiceUrl.split(':')[1] || 3005,
          path: '/doctors',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        };

        const request = http.request(options, (response) => {
          let body = '';
          response.on('data', (chunk) => {
            body += chunk;
          });
          response.on('end', () => {
            try {
              const jsonData = JSON.parse(body);
              resolve(jsonData);
            } catch (parseError) {
              reject(parseError);
            }
          });
        });

        request.on('error', (error) => {
          reject(error);
        });

        request.end();
      });
      
      if (data.success && data.metadata && Array.isArray(data.metadata)) {
        // Transform the data to match chat service format
        const doctors = data.metadata.map(doctor => ({
          userId: doctor.id,
          firstName: doctor.first_name,
          lastName: doctor.last_name,
          specialization: doctor.specializations?.[0] || 'General Medicine',
          profileImage: doctor.profile_image_url,
          isOnline: false, // Default to offline since we don't track this in appointment service
          rating: doctor.rating,
          consultation_fee: doctor.consultation_fee
        }));
        
        return new OK({ metadata: doctors }).send(res);
      } else {
        return new OK({ metadata: [] }).send(res);
      }
    } catch (error) {
      console.error('Get doctors error:', error);
      return new InternalServerError('Failed to fetch doctors from appointment service').send(res);
    }
  }



  /**
   * Get all staff members
   */
  static async getStaff(req, res) {
    try {
      const staff = await UserService.getAllStaff();
      
      return new OK({ metadata: staff }).send(res);
    } catch (error) {
      console.error('Get staff error:', error);
      return new InternalServerError('Failed to fetch staff').send(res);
    }
  }

  /**
   * Search users
   */
  static async searchUsers(req, res) {
    try {
      const { q } = req.query;
      const currentUserId = req.user.sub;

      if (!q || q.trim().length < 2) {
        return new BadRequestError('Search query must be at least 2 characters').send(res);
      }

      const users = await UserService.searchUsers(q.trim(), currentUserId);
      
      return new OK({ metadata: users }).send(res);
    } catch (error) {
      console.error('Search users error:', error);
      return new InternalServerError('Failed to search users').send(res);
    }
  }

  /**
   * Get user by ID (for creating conversations)
   */
  static async getUserById(req, res) {
    try {
      const { userId } = req.params;
      
      const user = await UserService.getUserByUserId(parseInt(userId));
      if (!user) {
        return new NotFoundError('User not found').send(res);
      }

      return new OK({ metadata: user }).send(res);
    } catch (error) {
      console.error('Get user by ID error:', error);
      return new InternalServerError('Failed to fetch user').send(res);
    }
  }
}

module.exports = UserController; 