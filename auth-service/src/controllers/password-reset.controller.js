const PasswordResetService = require('../services/password-reset.service.js');
const { OK, BadRequestError, NotFoundError } = require('../utils/httpResponses.js');

class PasswordResetController {
  static async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;
      
      if (!email) {
        throw new BadRequestError('Email is required');
      }

      const result = await PasswordResetService.requestPasswordReset(email);
      
      // For now, return the token directly since we don't have email service
      // In production, you'd send this via email and return a generic message
      return new OK({ 
        message: 'Password reset requested successfully',
        // TODO: Remove this in production - only for development
        resetToken: result.resetToken,
        expiresAt: result.expiresAt
      }).send(res);
    } catch (error) {
      if (error instanceof NotFoundError) {
        // For security, don't reveal if email exists or not
        return new OK({ message: 'If the email exists, a reset link has been sent' }).send(res);
      }
      throw error;
    }
  }

  static async verifyResetToken(req, res) {
    try {
      const { token } = req.query;
      
      if (!token) {
        throw new BadRequestError('Reset token is required');
      }

      const isValid = await PasswordResetService.verifyResetToken(token);
      
      return new OK({ 
        message: 'Token is valid',
        isValid 
      }).send(res);
    } catch (error) {
      return new BadRequestError('Invalid or expired reset token').send(res);
    }
  }

  static async resetPassword(req, res) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        throw new BadRequestError('Reset token and new password are required');
      }

      if (newPassword.length < 8) {
        throw new BadRequestError('Password must be at least 8 characters long');
      }

      await PasswordResetService.resetPassword(token, newPassword);
      
      return new OK({ 
        message: 'Password has been reset successfully' 
      }).send(res);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PasswordResetController; 