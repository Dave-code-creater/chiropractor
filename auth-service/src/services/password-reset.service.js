const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { findUserByEmail, updateUser } = require('../repositories/user.repo.js');
const { createPasswordReset, findPasswordResetByToken, deletePasswordReset } = require('../repositories/password-reset.repo.js');
const { NotFoundError, BadRequestError } = require('../utils/httpResponses.js');

class PasswordResetService {
  static async requestPasswordReset(email) {
    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

    // Store reset token in database
    await createPasswordReset({
      userId: user.id,
      token: resetToken,
      expiresAt,
      createdAt: new Date()
    });

    // TODO: In production, send email with reset link
    // await EmailService.sendPasswordResetEmail(user.email, resetToken);

    return {
      resetToken, // Remove this in production
      expiresAt,
      message: 'Password reset token generated'
    };
  }

  static async verifyResetToken(token) {
    const resetRecord = await findPasswordResetByToken(token);
    
    if (!resetRecord) {
      throw new BadRequestError('Invalid reset token');
    }

    if (new Date() > new Date(resetRecord.expiresAt)) {
      // Clean up expired token
      await deletePasswordReset(resetRecord.id);
      throw new BadRequestError('Reset token has expired');
    }

    return true;
  }

  static async resetPassword(token, newPassword) {
    // Verify token is valid
    const resetRecord = await findPasswordResetByToken(token);
    
    if (!resetRecord) {
      throw new BadRequestError('Invalid reset token');
    }

    if (new Date() > new Date(resetRecord.expiresAt)) {
      // Clean up expired token
      await deletePasswordReset(resetRecord.id);
      throw new BadRequestError('Reset token has expired');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update user password
    await updateUser(resetRecord.userId, {
      password_hash: hashedPassword,
      updated_at: new Date()
    });

    // Clean up used token
    await deletePasswordReset(resetRecord.id);

    return {
      message: 'Password reset successfully'
    };
  }
}

module.exports = PasswordResetService; 