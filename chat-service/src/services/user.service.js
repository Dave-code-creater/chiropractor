const User = require('../models/user.model.js');

class UserService {
  /**
   * Auto-register user in chat service when account is created
   * This is called by webhooks from auth service or other services
   */
  static async autoRegisterUser(userData) {
    try {
      const {
        userId,
        email,
        firstName,
        lastName,
        role,
        specialization,
        licenseNumber,
        department,
        position,
        dateOfBirth,
        phone,
        profileImage
      } = userData;

      // Check if user already exists
      const existingUser = await User.findOne({ userId });
      if (existingUser) {
        console.log(`Chat user already exists for userId: ${userId}`);
        return existingUser;
      }

      // Create new chat user
      const chatUser = await User.create({
        userId,
        email,
        firstName,
        lastName,
        role,
        specialization: role === 'doctor' ? specialization : undefined,
        licenseNumber: role === 'doctor' ? licenseNumber : undefined,
        department: role === 'staff' ? department : undefined,
        position: role === 'staff' ? position : undefined,
        dateOfBirth: role === 'patient' ? dateOfBirth : undefined,
        phone,
        profileImage,
        status: 'active',
        isOnline: false
      });

      console.log(`✅ Auto-registered chat user: ${email} (${role})`);
      return chatUser;
    } catch (error) {
      console.error('❌ Error auto-registering chat user:', error);
      throw error;
    }
  }

  /**
   * Update user profile in chat service
   */
  static async updateUserProfile(userId, updateData) {
    try {
      const user = await User.findOneAndUpdate(
        { userId },
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );

      if (!user) {
        throw new Error(`Chat user not found: ${userId}`);
      }

      console.log(`✅ Updated chat user profile: ${userId}`);
      return user;
    } catch (error) {
      console.error('❌ Error updating chat user profile:', error);
      throw error;
    }
  }

  /**
   * Set user online status
   */
  static async setUserOnlineStatus(userId, isOnline) {
    try {
      const user = await User.findOneAndUpdate(
        { userId },
        { 
          isOnline,
          lastSeen: new Date()
        },
        { new: true }
      );

      return user;
    } catch (error) {
      console.error('❌ Error updating user online status:', error);
      throw error;
    }
  }

  /**
   * Get user by userId (from auth service)
   */
  static async getUserByUserId(userId) {
    try {
      return await User.findOne({ userId });
    } catch (error) {
      console.error('❌ Error fetching user by userId:', error);
      throw error;
    }
  }

  /**
   * Get all doctors for patient to chat with
   */
  static async getAllDoctors() {
    try {
      return await User.find({ 
        role: 'doctor', 
        status: 'active' 
      }).select('userId firstName lastName specialization profileImage isOnline');
    } catch (error) {
      console.error('❌ Error fetching doctors:', error);
      throw error;
    }
  }

  /**
   * Get all staff members
   */
  static async getAllStaff() {
    try {
      return await User.find({ 
        role: 'staff', 
        status: 'active' 
      }).select('userId firstName lastName department position profileImage isOnline');
    } catch (error) {
      console.error('❌ Error fetching staff:', error);
      throw error;
    }
  }

  /**
   * Search users by name or email
   */
  static async searchUsers(query, currentUserId) {
    try {
      const searchRegex = new RegExp(query, 'i');
      
      return await User.find({
        userId: { $ne: currentUserId },
        status: 'active',
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { email: searchRegex }
        ]
      }).select('userId firstName lastName email role profileImage isOnline');
    } catch (error) {
      console.error('❌ Error searching users:', error);
      throw error;
    }
  }
}

module.exports = UserService; 