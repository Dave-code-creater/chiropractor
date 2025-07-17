const jwt = require('jsonwebtoken');
const { SignupSuccess, LoginSuccess, LogoutSuccess, ProfileRetrieved, BadRequestError, NotFoundError, ConflictError, UnauthorizedError, InternalServerError } = require('../utils/httpResponses');
const { getUserRepository, getPatientRepository, getDoctorRepository, getApiKeyRepository } = require('../repositories');
const { auth, error: logError, info, debug } = require('../utils/logger');

/**
 * Authentication Service
 * Static methods for authentication business logic
 * 
 * Flow: [Controller] -> [Service] -> [Repository] -> [Database]
 */
class AuthService {
  /**
   * Register a new user with profile
   * @param {Object} userData - User registration data
   * @param {Object} req - Request object
   * @returns {Object} Registration result with user and token
   */
  static async registerUser(userData, req) {
    const {
      email,
      password,
      confirm_password,
      first_name,
      last_name,
      role = 'patient',
      specialization,
      phone_number
    } = userData;

    // Business logic validations
    if (password !== confirm_password) {
      throw new BadRequestError('Passwords do not match', '4002');
    }

    try {
      const userRepo = getUserRepository();
      const patientRepo = getPatientRepository();
      const doctorRepo = getDoctorRepository();
      const apiKeyRepo = getApiKeyRepository();

      // Check if email already exists
      const existingUser = await userRepo.findByEmail(email);
      if (existingUser) {
        throw new BadRequestError('Email already registered', '4090');
      }

      // Create user and profile in transaction
      const result = await userRepo.transaction(async () => {
        // Create user
        const user = await userRepo.createUser({
          email,
          password,
          role,
          phone_number
        });

        auth.info(' User created:', { id: user.id, email: user.email, role: user.role });

        // Create corresponding profile
        let profile = null;
        if (role === 'patient' || role === 'staff') {
          profile = await patientRepo.createPatient({
            user_id: user.id,
            first_name,
            last_name,
            email,
            phone: phone_number
          });
          auth.info(' Patient profile created:', { id: profile.id, name: `${first_name} ${last_name}` });
        } else if (role === 'doctor') {
          profile = await doctorRepo.createDoctor({
            user_id: user.id,
            first_name,
            last_name,
            specialization,
            phone_number,
            email
          });
          auth.info(' Doctor profile created:', { id: profile.id, name: `${first_name} ${last_name}` });
        }

        // Generate token pair
        const tokens = AuthService.generateTokenPair(user, profile);

        // Log the session
        const session = {
          user_id: user.id,
          session_token: tokens.token,
          event_type: 'login',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'],
          device_type: req.headers['device-type'],
          device_os: req.headers['device-os'],
          browser_name: req.headers['browser-name'],
          browser_version: req.headers['browser-version'],
          is_mobile: req.headers['is-mobile'],
          location_country: req.headers['location-country'],
          location_city: req.headers['location-city'],
          success: true,
          failure_reason: null,
          session_duration_minutes: 0,
          created_at: new Date(),

        }

        // Store API key for session management
        await apiKeyRepo.createApiKey({
          user_id: user.id,
          key: tokens.token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        auth.info('🔑 API key stored for session management');

        return { user, profile, tokens };
      });

      // Format response for frontend
      const formattedUser = AuthService.formatUserForFrontend(result.user, result.profile);

      return {
        token: result.tokens.token,
        refreshToken: result.tokens.refreshToken,
        user: formattedUser
      };
    } catch (error) {
      auth.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Authenticate user login
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {boolean} rememberMe - Extended session flag
   * @param {Object} req - Request object
   * @returns {Object} Login result with user and token
   */
  static async loginUser(email, password, rememberMe = false, req) {
    try {
      const userRepo = getUserRepository();
      const apiKeyRepo = getApiKeyRepository();

      // Find user by email
      const user = await userRepo.findByEmail(email);
      if (!user) {
        throw new UnauthorizedError('Invalid email or password', '4011');
      }

      // Check if user is active
      if (user.status !== 'active') {
        throw new UnauthorizedError('Account is inactive. Please contact administrator.', '4012');
      }

      // Verify password
      const isPasswordValid = await userRepo.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        throw new UnauthorizedError('Invalid email or password', '4011');
      }

      // Get user with profile data
      const userWithProfile = await userRepo.getUserWithProfile(user.id);

      // Generate new token
      const expiresIn = rememberMe ? '30d' : '24h';
      const token = AuthService.generateToken(user, userWithProfile, expiresIn);

      // Store API key
      const expirationTime = rememberMe 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await apiKeyRepo.createApiKey({
        user_id: user.id,
        key: token,
        expires_at: expirationTime
      });

      // Update last login
      await userRepo.updateLastLogin(user.id);

      auth.info(' Login successful:', { user_id: user.id, email: user.email });

      // Generate token pair
      const tokens = AuthService.generateTokenPair(user, userWithProfile, rememberMe);

      // Store tokens in API key repository
      await apiKeyRepo.createApiKey({
        user_id: user.id,
        key: tokens.token,
        expires_at: new Date(Date.now() + (rememberMe ? 30 * 24 : 7 * 24) * 60 * 60 * 1000)
      });

      // Format user for frontend
      const formattedUser = AuthService.formatUserForFrontend(user, userWithProfile);

      return {
        token: tokens.token,
        refreshToken: tokens.refreshToken,
        user: formattedUser
      };
    } catch (error) {
      auth.error('Login service error:', error);
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new InternalServerError('Login failed', '5002');
    }
  }

  /**
   * Refresh user token
   * @param {string} token - Current token
   * @param {Object} req - Request object
   * @returns {Object} New token and user data
   */
  static async refreshToken(token, req) {
    try {
      const userRepo = getUserRepository();
      const apiKeyRepo = getApiKeyRepository();

      // Verify the refresh token
      let decoded;
      try {
        // Try to verify as refresh token first
        try {
          decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
          if (decoded.type !== 'refresh') {
            throw new Error('Not a refresh token');
          }
        } catch (refreshError) {
          // If refresh token verification fails, try as access token (for backward compatibility)
          decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
        }
      } catch (error) {
        throw new UnauthorizedError('Invalid refresh token', '4013');
      }

      // Check if user still exists and is active
      const user = await userRepo.findById(decoded.user_id);
      if (!user || user.status !== 'active') {
        throw new UnauthorizedError('User not found or inactive', '4014');
      }

      // Get user with profile
      const userWithProfile = await userRepo.getUserWithProfile(user.id);

      // Generate new token pair
      const tokens = AuthService.generateTokenPair(user, userWithProfile);

      // Store new API key
      await apiKeyRepo.createApiKey({
        user_id: user.id,
        key: tokens.token,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Revoke old tokens
      await apiKeyRepo.revokeRefreshToken(user.id, token);

      auth.info(' Token refresh successful for user:', user.id);

      // Format user for frontend
      const formattedUser = AuthService.formatUserForFrontend(user, userWithProfile);

      return {
        token: tokens.token,
        refreshToken: tokens.refreshToken,
        user: formattedUser
      };
    } catch (error) {
      auth.error('Token refresh service error:', error);
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      throw new InternalServerError('Token refresh failed', '5003');
    }
  }

  /**
   * Logout user by deactivating their API key
   * @param {number} userId - User ID
   * @param {string} token - Token to revoke
   * @returns {boolean} Success status
   */
  static async logoutUser(userId, token) {
    try {
      const apiKeyRepo = getApiKeyRepository();
      
      // Deactivate the specific token
      await apiKeyRepo.revokeRefreshToken(userId, token);
      auth.info(' Logout successful for user:', userId);
      return true;
    } catch (error) {
      auth.error('Logout service error:', error);
      throw new InternalServerError('Logout failed', '5004');
    }
  }

  /**
   * Logout user from all devices
   * @param {number} userId - User ID
   * @returns {boolean} Success status
   */
  static async logoutFromAllDevices(userId) {
    try {
      const apiKeyRepo = getApiKeyRepository();
      
      await apiKeyRepo.revokeAllUserTokens(userId);
      auth.info(' Logout from all devices successful for user:', userId);
      return true;
    } catch (error) {
      auth.error('Logout from all devices service error:', error);
      throw new InternalServerError('Logout from all devices failed', '5005');
    }
  }

  /**
   * Get user profile with complete data
   * @param {number} userId - User ID
   * @returns {Object} User profile data
   */
  static async getUserProfile(userId) {
    try {
      const userRepo = getUserRepository();
      
      const userProfile = await userRepo.getUserWithProfile(userId);
      if (!userProfile) {
        throw new NotFoundError('User not found', '4041');
      }

      return AuthService.formatUserForFrontend(userProfile, userProfile);
    } catch (error) {
      auth.error('Get user profile service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to retrieve user profile', '5006');
    }
  }

  /**
   * Verify user account
   * @param {number} userId - User ID
   * @returns {Object} Updated user data
   */
  static async verifyUserAccount(userId) {
    try {
      const userRepo = getUserRepository();
      
      const user = await userRepo.activateUser(userId);
      if (!user) {
        throw new NotFoundError('User not found', '4042');
      }

      auth.info(' Account verified for user:', userId);
      return { user };
    } catch (error) {
      auth.error('Account verification service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Account verification failed', '5007');
    }
  }

  /**
   * Verify email with token (placeholder)
   * @param {string} token - Verification token
   * @returns {Object} Verification result
   */
  static async verifyEmail(token) {
    try {
      // Placeholder implementation - user mentioned they have SMTP set up
      // but don't want to implement email verification yet
      // In a real implementation, you would:
      // 1. Validate the token format
      // 2. Find user by verification token
      // 3. Update user email verification status
      // 4. Invalidate the token
      
      auth.info(' Email verification (placeholder):', { token: token ? 'provided' : 'missing' });
      
      if (!token) {
        throw new BadRequestError('Verification token is required', '4001');
      }
      
      return {
        verified: true,
        message: 'Email verified successfully (placeholder implementation)'
      };
    } catch (error) {
      auth.error('Email verification service error:', error);
      if (error instanceof BadRequestError) {
        throw error;
      }
      throw new InternalServerError('Email verification failed', '5004');
    }
  }

  /**
   * Get all users with pagination and filtering (Admin only)
   * @param {Object} options - Query options
   * @returns {Object} Users list with pagination
   */
  static async getAllUsers(options = {}) {
    try {
      const userRepo = getUserRepository();
      
      const { page = 1, limit = 10, role, status } = options;
      
      const conditions = {};
      if (role) conditions.role = role;
      if (status) conditions.status = status;

      const offset = (page - 1) * limit;
      const users = await userRepo.findBy(conditions, '*', { limit, offset });
      const totalCount = await userRepo.count(conditions);

      return {
        users: users.map(user => ({
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status,
          is_verified: user.is_verified,
          created_at: user.created_at,
          last_login_at: user.last_login_at
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit)
        }
      };
    } catch (error) {
      auth.error('Get all users service error:', error);
      throw new InternalServerError('Failed to retrieve users', '5008');
    }
  }

 

  /**
   * Generate JWT access token
   * @param {Object} user - User object
   * @param {Object} profile - User profile object
   * @param {string} expiresIn - Token expiration time
   * @returns {string} JWT access token
   */
  static generateAccessToken(user, profile = null, expiresIn = '15m') {
    const tokenPayload = {
      user_id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      status: user.status,
      type: 'access'
    };

    if (profile) {
      tokenPayload.profile_id = profile.patient_id || profile.doctor_id || profile.id;
      tokenPayload.first_name = profile.patient_first_name || profile.doctor_first_name || profile.first_name;
      tokenPayload.last_name = profile.patient_last_name || profile.doctor_last_name || profile.last_name;
    }

    return jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { 
        expiresIn,
        issuer: 'chiropractor-clinic',
        audience: 'clinic-users'
      }
    );
  }

  /**
   * Generate JWT refresh token
   * @param {Object} user - User object
   * @param {string} expiresIn - Token expiration time
   * @returns {string} JWT refresh token
   */
  static generateRefreshToken(user, expiresIn = '7d') {
    const tokenPayload = {
      user_id: user.id,
      email: user.email,
      type: 'refresh'
    };

    return jwt.sign(
      tokenPayload,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { 
        expiresIn,
        issuer: 'chiropractor-clinic',
        audience: 'clinic-users'
      }
    );
  }

  /**
   * Generate both access and refresh tokens
   * @param {Object} user - User object
   * @param {Object} profile - User profile object
   * @param {boolean} rememberMe - Extended session flag
   * @returns {Object} Token pair
   */
  static generateTokenPair(user, profile = null, rememberMe = false) {
    const accessTokenExpiry = rememberMe ? '30m' : '15m';
    const refreshTokenExpiry = rememberMe ? '30d' : '7d';

    return {
      token: AuthService.generateAccessToken(user, profile, accessTokenExpiry),
      refreshToken: AuthService.generateRefreshToken(user, refreshTokenExpiry)
    };
  }

  /**
   * Legacy method for backward compatibility
   * @param {Object} user - User object
   * @param {Object} profile - User profile object
   * @param {string} expiresIn - Token expiration time
   * @returns {string} JWT token
   */
  static generateToken(user, profile = null, expiresIn = '15m') {
    return AuthService.generateAccessToken(user, profile, expiresIn);
  }

  /**
   * Format profile data for consistent response
   * @param {Object} userWithProfile - User with profile data
   * @returns {Object} Formatted profile
   */
  static formatProfile(userWithProfile) {
    if (userWithProfile.role === 'doctor') {
      return {
        id: userWithProfile.doctor_id,
        first_name: userWithProfile.doctor_first_name,
        last_name: userWithProfile.doctor_last_name,
        specialization: userWithProfile.specialization,
        license_number: userWithProfile.license_number,
        type: 'doctor'
      };
    } else if (userWithProfile.role === 'patient' || userWithProfile.role === 'staff') {
      return {
        id: userWithProfile.patient_id,
        first_name: userWithProfile.patient_first_name,
        last_name: userWithProfile.patient_last_name,
        date_of_birth: userWithProfile.date_of_birth,
        gender: userWithProfile.gender,
        marriage_status: userWithProfile.marriage_status,
        race: userWithProfile.race,
        type: 'patient'
      };
    }
    return null;
  }

  /**
   * Format user data for frontend consumption
   * @param {Object} user - User object
   * @param {Object} profile - Profile object (patient/doctor)
   * @returns {Object} Formatted user object
   */
  static formatUserForFrontend(user, profile = null) {
    const baseUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      phone_number: user.phone_number,
      is_verified: user.is_verified,
      phone_verified: user.phone_verified,
      status: user.status,
      created_at: user.created_at,
      last_login_at: user.last_login_at
    };

    if (profile) {
      if (user.role === 'doctor') {
        baseUser.profile = {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          full_name: `${profile.first_name} ${profile.last_name}`,
          specialization: profile.specialization,
          license_number: profile.license_number,
          type: 'doctor'
        };
      } else if (user.role === 'patient' || user.role === 'staff') {
        baseUser.profile = {
          id: profile.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          full_name: `${profile.first_name} ${profile.last_name}`,
          email: profile.email,
          phone: profile.phone,
          date_of_birth: profile.date_of_birth,
          gender: profile.gender,
          marriage_status: profile.marriage_status,
          race: profile.race,
          type: 'patient'
        };
      }
    }

    return baseUser;
  }

  /**
   * Register a new patient user
   * @param {Object} userData - Patient registration data
   * @param {Object} req - Request object
   * @returns {Object} Registration result with user, patient profile, and token
   */
  static async registerPatient(userData, req) {
    const {
      first_name,
      last_name,
      phone_number,
      email,
      password,
      confirm_password
    } = userData;

    // Business logic validations
    if (password !== confirm_password) {
      throw new BadRequestError('Passwords do not match', '4002');
    }

    try {
      const userRepo = getUserRepository();
      const patientRepo = getPatientRepository();
      const apiKeyRepo = getApiKeyRepository();

      // Check if user already exists
      const existingUser = await userRepo.findByEmail(email);
      if (existingUser) {
        throw new ConflictError('An account with this email already exists', '4091');
      }

      // Use transaction to ensure data consistency
      const result = await userRepo.transaction(async () => {
        // Create user account
        const user = await userRepo.createUser({
          email,
          password,
          role: 'patient',
          phone_number,
          is_verified: false,
          phone_verified: false,
          status: 'active'
        });

        auth.info(' User account created:', { id: user.id, email: user.email });

        // Create patient profile
        const patient = await patientRepo.createPatient({
          user_id: user.id,
          first_name,
          last_name,
          email,
          phone: phone_number,
          status: 'active'
        });

        auth.info(' Patient profile created:', { 
          id: patient.id, 
          name: `${first_name} ${last_name}` 
        });

        // Generate token pair
        const tokens = AuthService.generateTokenPair(user, patient);

        // Store API key for session management
        await apiKeyRepo.createApiKey({
          user_id: user.id,
          key: tokens.token,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        });

        auth.info('🔑 Session tokens created');

        return { user, patient, tokens };
      });

      // Format response for frontend
      const formattedUser = AuthService.formatUserForFrontend(result.user, result.patient);

      return {
        token: result.tokens.token,
        refreshToken: result.tokens.refreshToken,
        user: formattedUser
      };

    } catch (error) {
      auth.error('Patient registration service error:', error);
      if (error instanceof BadRequestError || error instanceof ConflictError) {
        throw error;
      }
      throw new InternalServerError('Registration failed. Please try again.', '5001');
    }
  }
}

module.exports = AuthService; 