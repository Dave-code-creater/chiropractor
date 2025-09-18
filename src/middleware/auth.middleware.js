const jwt = require('jsonwebtoken');
const config = require('../config');
const { ErrorResponse } = require('../utils/httpResponses');
const { getUserRepository, getApiKeyRepository } = require('../repositories');
const { auth, error: logError } = require('../utils/logger');

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user data to request
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    const token = tokenFromHeader || req.cookies?.accessToken;



    if (!token) {
      throw new ErrorResponse('Access token required', 401, '4001');
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, config.jwt.secret);
      auth.info('JWT verification successful:', { user_id: decoded.user_id, type: decoded.type });
      
      // Optional: Verify token exists in database (for session management)
      const apiKeyRepo = getApiKeyRepository();
      const apiKey = await apiKeyRepo.findByKey(token);
      
      if (!apiKey || apiKey.expires_at < new Date()) {
        throw new ErrorResponse('Token expired or invalid', 401, '4002');
      }

      // Get current user data
      const userRepo = getUserRepository();
      const user = await userRepo.findById(decoded.user_id);
      
      if (!user || user.status !== 'active') {
        throw new ErrorResponse('User not found or inactive', 401, '4005');
      }

      // Attach user data to request
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        token: token,
        profile_id: decoded.profile_id,
        first_name: decoded.first_name,
        last_name: decoded.last_name
      };
      
      auth.info('Authentication successful for user:', { email: user.email });
      next();
    } catch (jwtError) {
      auth.error('Auth error details:', {
        errorName: jwtError.name,
        errorMessage: jwtError.message,
        isErrorResponse: jwtError instanceof ErrorResponse
      });
      
      if (jwtError instanceof ErrorResponse) {
        throw jwtError;
      }
      
      if (jwtError.name === 'TokenExpiredError') {
        throw new ErrorResponse('Token expired', 401, '4002');
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw new ErrorResponse('Invalid token', 401, '4003');
      } else {
        throw new ErrorResponse('Token verification failed', 401, '4004');
      }
    }
  } catch (error) {
    auth.error('Authentication middleware error:', error);
    if (error instanceof ErrorResponse) {
      return error.send(res);
    }
    
    auth.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      statusCode: 401,
      errorCode: '4000'
    });
  }
};

/**
 * Authorization Middleware Factory
 * Creates middleware for role-based access control
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    try {
      // Flatten the allowedRoles array in case it's nested
      const flattenedRoles = allowedRoles.flat();
      
      if (!req.user) {
        auth.warn('Authorization failed: No user in request');
        throw new ErrorResponse('Authentication required', 401, '4001');
      }

      // Clean and normalize the user role and allowed roles
      const userRole = req.user.role ? req.user.role.toString().trim().toLowerCase() : '';
      const normalizedAllowedRoles = flattenedRoles.map(role => role.toString().trim().toLowerCase());

      if (!normalizedAllowedRoles.includes(userRole)) {
        auth.warn(`Authorization failed: Role '${req.user.role}' (normalized: '${userRole}') not in allowed roles: [${flattenedRoles.join(', ')}] (normalized: [${normalizedAllowedRoles.join(', ')}])`);
        throw new ErrorResponse(
          `Access denied. Required roles: ${flattenedRoles.join(', ')}. Your role: ${req.user.role}`,
          403,
          '4030'
        );
      }

      auth.info('Authorization successful for role:', { role: req.user.role });
      next();
    } catch (error) {
      auth.error('Authorization middleware error:', error);
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      
      const errorResponse = new ErrorResponse('Authorization failed', 403, '4031');
      errorResponse.send(res);
    }
  };
};

/**
 * Optional authentication middleware
 * Attaches user data if token is provided but doesn't require authentication
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    const token = tokenFromHeader || req.cookies?.accessToken;

    if (!token) {
      return next(); // Continue without authentication
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const userRepo = getUserRepository();
      const user = await userRepo.findById(decoded.user_id);
      
      if (user && user.status === 'active') {
        req.user = {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status,
          token: token
        };
      }
    } catch (jwtError) {
      // Ignore JWT errors for optional auth
    }
    
    next();
  } catch (error) {
    auth.error('Optional auth error:', error);
    next(); // Continue even if there's an error
  }
};

/**
 * Lenient authentication middleware for logout operations
 * Allows logout even with expired/invalid database tokens
 */
const authenticateForLogout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    const tokenFromHeader = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : null;

    const token = tokenFromHeader || req.cookies?.accessToken;

    if (!token) {
      throw new ErrorResponse('Access token required', 401, '4001');
    }

    try {
      // Only verify JWT token, skip database validation for logout
      const decoded = jwt.verify(token, config.jwt.secret);
      
      // Get current user data
      const userRepo = getUserRepository();
      const user = await userRepo.findById(decoded.user_id);
      
      if (!user) {
        throw new ErrorResponse('User not found', 401, '4005');
      }

      // Attach user data to request (allow even inactive users to logout)
      req.user = {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        token: token
      };
      
      next();
    } catch (jwtError) {
      if (jwtError instanceof ErrorResponse) {
        throw jwtError;
      }
      
      if (jwtError.name === 'TokenExpiredError') {
        throw new ErrorResponse('Token expired', 401, '4002');
      } else if (jwtError.name === 'JsonWebTokenError') {
        throw new ErrorResponse('Invalid token', 401, '4003');
      } else {
        throw new ErrorResponse('Token verification failed', 401, '4004');
      }
    }
  } catch (error) {
    if (error instanceof ErrorResponse) {
      return error.send(res);
    }
    
    auth.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      statusCode: 401,
      errorCode: '4000'
    });
  }
};

/**
 * Authorization middleware to check if user can access specific appointment
 * Patients can only see their own appointments
 * Doctors can see appointments assigned to them
 * Staff/admin can see all appointments
 */
const authorizeAppointmentAccess = async (req, res, next) => {
  try {
    const appointmentId =
      req.params.id ||
      req.params.appointmentId ||
      req.params.appointment_id;
    const user = req.user;
    
    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required',
        statusCode: 400
      });
    }

    // Admin and staff can access all appointments
    if (user.role === 'admin' || user.role === 'staff') {
      return next();
    }

    // Get appointment details to check ownership
    const { getPostgreSQLPool } = require('../config/database');
    const pool = getPostgreSQLPool();
    
    if (!pool) {
      return res.status(503).json({
        success: false,
        message: 'Database connection not available',
        statusCode: 503
      });
    }

    const appointmentQuery = `
      SELECT 
        a.id,
        a.patient_id,
        a.doctor_id,
        p.email as patient_email,
        p.user_id as patient_user_id,
        d.user_id as doctor_user_id,
        u.email as patient_user_email
      FROM appointments a
      LEFT JOIN patients p ON a.patient_id = p.id
      LEFT JOIN doctors d ON a.doctor_id = d.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE a.id = $1
    `;

    const result = await pool.query(appointmentQuery, [appointmentId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found',
        statusCode: 404
      });
    }

    const appointment = result.rows[0];

    // Check authorization based on user role
    let isAuthorized = false;

    if (user.role === 'doctor') {
      // Doctor can access appointments assigned to them
      isAuthorized = appointment.doctor_user_id === user.id;
    } else if (user.role === 'patient') {
      // Patient can access their own appointments
      // Check patient_user_id first (most reliable), then check emails
      isAuthorized = (
        (appointment.patient_user_id && appointment.patient_user_id === user.id) ||
        (appointment.patient_user_email && appointment.patient_user_email === user.email) ||
        (appointment.patient_email && appointment.patient_email === user.email)
      );
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own appointments.',
        statusCode: 403
      });
    }

    // Store appointment data for use in controller if needed
    req.appointment = appointment;
    next();

  } catch (error) {
          auth.error('Authorization middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed',
      statusCode: 500
    });
  }
};

/**
 * Authorization middleware for patient appointments list
 * Ensures patients can only see their own appointments
 */
const authorizePatientAppointments = async (req, res, next) => {
  try {
    const requestedPatientId =
      req.params.patientId ||
      req.params.patient_id;

    if (!requestedPatientId) {
      return res.status(400).json({
        success: false,
        message: 'Patient ID is required',
        statusCode: 400
      });
    }
    const user = req.user;

    // Admin and staff can access all patient appointments
    if (user.role === 'admin' || user.role === 'staff') {
      return next();
    }

    // Doctors can access appointments for patients they treat
    if (user.role === 'doctor') {
      // We'll allow doctors to access any patient's appointments
      // You could add more restrictive logic here if needed
      return next();
    }

    if (user.role === 'patient') {
      // Get the patient record for the current user
      const { getPostgreSQLPool } = require('../config/database');
      const pool = getPostgreSQLPool();
      
      if (!pool) {
        return res.status(503).json({
          success: false,
          message: 'Database connection not available',
          statusCode: 503
        });
      }

      const patientQuery = 'SELECT id FROM patients WHERE user_id = $1';
      const result = await pool.query(patientQuery, [user.id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Patient profile not found',
          statusCode: 404
        });
      }

      const userPatientId = result.rows[0].id;

      // Check if requested patient ID matches user's patient ID
      if (parseInt(requestedPatientId, 10) !== userPatientId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only view your own appointments.',
          statusCode: 403
        });
      }
    }

    next();

  } catch (error) {
          auth.error('Patient authorization middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authorization check failed',
      statusCode: 500
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  authenticateForLogout,
  authorizeAppointmentAccess,
  authorizePatientAppointments
}; 
