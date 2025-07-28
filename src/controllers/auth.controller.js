const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { SuccessResponse, ErrorResponse, SignupSuccess, LoginSuccess, LogoutSuccess, ProfileSuccess } = require('../utils/httpResponses');
const { getUserRepository, getPatientRepository, getDoctorRepository, getApiKeyRepository } = require('../repositories');
const { registerSchema, loginSchema } = require('../validators');
const logger = require('../utils/logger');
const httpResponses = require('../utils/httpResponses');
const asyncHandler = require('../utils/asyncHandler');

const AuthService = require('../services/auth.service');

/**
 * Authentication Controller
 * Static methods that handle HTTP concerns and delegate business logic to AuthService
 * 
 * Flow: [Routing] -> [Controller] -> [Service] -> [Repository] -> [Database]
 */
class AuthController {
  /**
   * Register a new user (doctors)
   * POST /api/auth/register
   */
  static async register(req, res) {
    try {
      const result = await AuthService.registerUser(req.body, req);
      return res.status(201).json({
        success: true,
        message: 'Registration successful',
        ...result
      });
    } catch (error) {
      return AuthController.handleError(error, res);
    }
  }

  /**
   * Register a new patient
   * POST /api/auth/register-patient
   */
  static async registerPatient(req, res) {
    try {
      auth.info(' Patient registration request received:', {
        email: req.body?.email,
        first_name: req.body?.first_name,
        last_name: req.body?.last_name
      });

      const result = await AuthService.registerPatient(req.body, req);

      auth.info(' Patient registration successful:', {
        user_id: result.data.user.id,
        patient_id: result.data.patient.id,
        email: result.data.user.email,
        name: result.data.patient.full_name
      });

      return res.status(201).json({
        success: true,
        message: 'Patient registration successful! Welcome to our platform.',
        ...result
      });
    } catch (error) {
      auth.error('Patient registration controller error:', error);
      return AuthController.handleError(error, res);
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req, res) {
    try {
      const { email, password, remember_me } = req.body;
      const result = await AuthService.loginUser(email, password, remember_me, req);

      // Set HTTP-only cookies for tokens
      const secureCookie = process.env.NODE_ENV === 'production';

      // Access token (short-lived)
      res.cookie('accessToken', result.token, {
        httpOnly: true,
        secure: secureCookie,
        sameSite: 'lax',
        maxAge: remember_me ? 30 * 24 * 60 * 60 * 1000 : 15 * 60 * 1000 // 30 days vs 15 minutes
      });

      // Refresh token (long-lived)
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: secureCookie,
        sameSite: 'lax',
        maxAge: remember_me ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000 // 30 days vs 7 days
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        ...result
      });
    } catch (error) {
      return AuthController.handleError(error, res);
    }
  }

  /**
   * Refresh token
   * POST /api/auth/refresh-token
   */
  static async refreshToken(req, res) {
    try {
      const token = req.cookies?.refreshToken || req.headers.authorization?.substring(7) || req.body.refresh_token;
      const result = await AuthService.refreshToken(token, req);

      // Update cookies with new tokens
      const secureCookie = process.env.NODE_ENV === 'production';

      res.cookie('accessToken', result.token, {
        httpOnly: true,
        secure: secureCookie,
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000 // 15 minutes default for access token
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: secureCookie,
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days default for refresh token
      });

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        ...result
      });
    } catch (error) {
      return AuthController.handleError(error, res);
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req, res) {
    try {
      const token = req.headers.authorization?.substring(7) || req.cookies?.accessToken;
      await AuthService.logoutUser(req.user.id, token);

      // Clear token cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return res.status(200).json({
        success: true,
        message: 'Logout successful'
      });
    } catch (error) {
      return AuthController.handleError(error, res);
    }
  }

  /**
   * Logout from all devices
   * POST /api/auth/logout-all
   */
  static async logoutFromAllDevices(req, res) {
    try {
      await AuthService.logoutFromAllDevices(req.user.id);

      // Clear token cookies from client
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return res.status(200).json({
        success: true,
        message: 'Logged out from all devices successfully'
      });
    } catch (error) {
      return AuthController.handleError(error, res);
    }
  }

  /**
   * Register a new user (doctors)
   * POST /api/auth/register
   */
  static async registerUser(req, res) {
    try {
      auth.info(' Registration request received:', {
        email: req.body?.email,
        role: req.body?.role || 'patient'
      });

      // Request has already been validated by validation middleware
      const result = await AuthService.registerUser(req.body, req);

      auth.info(' Registration successful:', {
        user_id: result.user.id,
        role: result.user.role,
        email: result.user.email
      });

      const response = new SuccessResponse('Registration successful', 201, {
        user: result.user,
        profile: result.profile,
        token: result.token
      });

      response.send(res);

    } catch (error) {
      auth.error('Registration controller error:', error);

      if (error instanceof ErrorResponse) {
        return error.send(res);
      }

      const errorResponse = new ErrorResponse(
        'Registration failed',
        500,
        '5000'
      );
      errorResponse.send(res);
    }
  }

  /**
   * Verify account
   * POST /api/auth/verify-account
   */
  static async verifyAccount(req, res) {
    try {
      await AuthService.verifyUserAccount(req.user.id);

      const response = new SuccessResponse('Account verified successfully', 200);
      response.send(res);

    } catch (error) {
      auth.error('Verify account controller error:', error);

      if (error instanceof ErrorResponse) {
        return error.send(res);
      }

      const errorResponse = new ErrorResponse('Account verification failed', 500, '5000');
      errorResponse.send(res);
    }
  }

  /**
   * Get all users (admin only)
   * GET /api/auth/users
   */
  static async getAllUsers(req, res) {
    try {
      const { page, limit, role, status } = req.query;
      const users = await AuthService.getAllUsers({ page, limit, role, status });

      const response = new SuccessResponse('Users retrieved successfully', 200, users);
      response.send(res);

    } catch (error) {
      auth.error('Get all users controller error:', error);

      if (error instanceof ErrorResponse) {
        return error.send(res);
      }

      const errorResponse = new ErrorResponse('Failed to get users', 500, '5000');
      errorResponse.send(res);
    }
  }

  /**
   * Verify email with token
   * POST /api/auth/verify-email
   */
  static async verifyEmail(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        throw new ErrorResponse('Verification token is required', 400, '4001');
      }

      const result = await AuthService.verifyEmail(token);

      const response = new SuccessResponse('Email verified successfully', 200, result);
      response.send(res);

    } catch (error) {
      auth.error('Verify email controller error:', error);

      if (error instanceof ErrorResponse) {
        return error.send(res);
      }

      const errorResponse = new ErrorResponse('Email verification failed', 500, '5000');
      errorResponse.send(res);
    }
  }

  /**
   * Test registration endpoint (development only)
   * GET /api/auth/test-registration
   */
  static async testRegistration(req, res) {
    try {
      if (process.env.NODE_ENV === 'production') {
        throw new ErrorResponse('Test endpoint not available in production', 404, '4040');
      }

      const testData = {
        message: 'Registration endpoint is working',
        required_fields: ['first_name', 'last_name', 'email', 'password', 'confirm_password', 'phone_number'],
        optional_fields: ['role', 'specialization', 'license_number'],
        roles: ['patient', 'doctor', 'admin']
      };

      const response = new SuccessResponse(
        'Test endpoint response',
        200,
        testData
      );

      response.send(res);
    } catch (error) {
      AuthController.handleError(error, res);
    }
  }

  /**
   * Error handler for the controller
   * @param {Error} error - Error object
   * @param {Object} res - Express response object
   */
  static handleError(error, res) {
    const { BadRequestError, UnauthorizedError, NotFoundError, ConflictError, InternalServerError } = require('../utils/httpResponses');
    const { api, error: logError, info, debug } = require('../utils/logger');

    if (error instanceof BadRequestError ||
      error instanceof UnauthorizedError ||
      error instanceof NotFoundError ||
      error instanceof ConflictError ||
      error instanceof InternalServerError) {
      return error.send(res);
    } else if (error instanceof ErrorResponse) {
      return error.send(res);
    } else {
      auth.error('Unexpected error in AuthController:', error);
      const errorResponse = new InternalServerError('Internal server error', '5000');
      return errorResponse.send(res);
    }
  }
}

// Export singleton instance to maintain consistency
module.exports = AuthController; 