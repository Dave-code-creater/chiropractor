const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { SuccessResponse, ErrorResponse } = require('../utils/httpResponses');
const { getPostgreSQLPool } = require('../config/database');
const { passwordResetRequestSchema, verifyResetTokenSchema, resetPasswordSchema } = require('../validators');
const { api, error: logError, info, debug } = require('../utils/logger');

class PasswordResetController {
  static async requestPasswordReset(req, res) {
    try {
      // Validate request body
      const { error, value } = passwordResetRequestSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const { email } = value;

      // Check if PostgreSQL is available
      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Find user by email with profile data
        const userResult = await client.query(
          `SELECT u.id, u.email, 
                  p.first_name as patient_first_name, p.last_name as patient_last_name,
                  d.first_name as doctor_first_name, d.last_name as doctor_last_name
           FROM users u
           LEFT JOIN patients p ON u.id = p.user_id AND u.role = 'patient'
           LEFT JOIN doctors d ON u.id = d.user_id AND u.role = 'doctor'
           WHERE u.email = $1 AND u.status = $2`,
          [email, 'active']
        );

        // Always return success for security (don't reveal if email exists)
        if (userResult.rows.length === 0) {
          const response = new SuccessResponse(
            'If an account with that email exists, a password reset link has been sent.',
            200,
            { message: 'Password reset request processed' }
          );
          response.send(res);
          return;
        }

        const user = userResult.rows[0];

        // Generate reset token
        const reset_token = uuidv4();
        const expires_at = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        // Store reset token in database
        await client.query(
          'INSERT INTO password_resets (id, user_id, token, expires_at, created_at) VALUES ($1, $2, $3, $4, NOW())',
          [uuidv4(), user.id, reset_token, expires_at]
        );

        // Clean up old expired tokens for this user
        await client.query(
          'DELETE FROM password_resets WHERE user_id = $1 AND expires_at < NOW()',
          [user.id]
        );

        // In a real application, you would send an email here
        // For now, we'll return the token in the response (NOT recommended for production)
        info(`Password reset token for ${email}: ${reset_token}`);
        info(`Reset link: ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${reset_token}`);

        const response = new SuccessResponse(
          'If an account with that email exists, a password reset link has been sent.',
          200,
          { 
            message: 'Password reset request processed'
          }
        );

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        logError('Password reset request error:', error);
        const errorResponse = new ErrorResponse('Internal server error during password reset request', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async verifyResetToken(req, res) {
    try {
      // Validate query parameters
      const { error, value } = verifyResetTokenSchema.validate(req.query);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const { token } = value;

      // Check if PostgreSQL is available
      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Find valid reset token with user profile data
        const tokenResult = await client.query(
          `SELECT pr.id, pr.user_id, pr.expires_at, u.email, u.role,
                  p.first_name as patient_first_name, p.last_name as patient_last_name,
                  d.first_name as doctor_first_name, d.last_name as doctor_last_name
           FROM password_resets pr
           JOIN users u ON pr.user_id = u.id
           LEFT JOIN patients p ON u.id = p.user_id AND u.role = 'patient'
           LEFT JOIN doctors d ON u.id = d.user_id AND u.role = 'doctor'
           WHERE pr.token = $1 AND pr.expires_at > NOW() AND u.status = 'active'`,
          [token]
        );

        if (tokenResult.rows.length === 0) {
          throw new ErrorResponse('Invalid or expired reset token', 400, '4002');
        }

        const resetData = tokenResult.rows[0];
        const first_name = resetData.role === 'patient' ? resetData.patient_first_name : resetData.doctor_first_name;
        const last_name = resetData.role === 'patient' ? resetData.patient_last_name : resetData.doctor_last_name;

        const response = new SuccessResponse('Reset token is valid', 200, {
          token_valid: true,
          user: {
            email: resetData.email,
            first_name: first_name,
            last_name: last_name
          },
          expires_at: resetData.expires_at
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        logError('Reset token verification error:', error);
        const errorResponse = new ErrorResponse('Internal server error during token verification', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async resetPassword(req, res) {
    try {
      // Validate request body
      const { error, value } = resetPasswordSchema.validate(req.body);
      if (error) {
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const { token, new_password } = value;

      // Check if PostgreSQL is available
      const pool = getPostgreSQLPool();
      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Begin transaction
        await client.query('BEGIN');

        // Find valid reset token with user profile data
        const tokenResult = await client.query(
          `SELECT pr.id, pr.user_id, u.email, u.role,
                  p.first_name as patient_first_name, p.last_name as patient_last_name,
                  d.first_name as doctor_first_name, d.last_name as doctor_last_name
           FROM password_resets pr
           JOIN users u ON pr.user_id = u.id
           LEFT JOIN patients p ON u.id = p.user_id AND u.role = 'patient'
           LEFT JOIN doctors d ON u.id = d.user_id AND u.role = 'doctor'
           WHERE pr.token = $1 AND pr.expires_at > NOW() AND u.status = 'active'`,
          [token]
        );

        if (tokenResult.rows.length === 0) {
          await client.query('ROLLBACK');
          throw new ErrorResponse('Invalid or expired reset token', 400, '4002');
        }

        const resetData = tokenResult.rows[0];

        // Hash new password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(new_password, saltRounds);

        // Update user password
        await client.query(
          'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
          [hashedPassword, resetData.user_id]
        );

        // Delete the used reset token
        await client.query(
          'DELETE FROM password_resets WHERE id = $1',
          [resetData.id]
        );

        // Delete all other reset tokens for this user
        await client.query(
          'DELETE FROM password_resets WHERE user_id = $1',
          [resetData.user_id]
        );

        // Invalidate all existing API keys/sessions for this user for security
        await client.query(
          'DELETE FROM api_keys WHERE user_id = $1',
          [resetData.user_id]
        );

        // Commit transaction
        await client.query('COMMIT');

        info(`Password reset successful for user: ${resetData.email}`);

        const first_name = resetData.role === 'patient' ? resetData.patient_first_name : resetData.doctor_first_name;
        const last_name = resetData.role === 'patient' ? resetData.patient_last_name : resetData.doctor_last_name;

        const response = new SuccessResponse('Password reset successful', 200, {
          message: 'Your password has been reset successfully. Please log in with your new password.',
          user: {
            email: resetData.email,
            first_name: first_name,
            last_name: last_name
          }
        });

        response.send(res);

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }

    } catch (error) {
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        logError('Password reset error:', error);
        const errorResponse = new ErrorResponse('Internal server error during password reset', 500, '5000');
        errorResponse.send(res);
      }
    }
  }
}

module.exports = PasswordResetController; 