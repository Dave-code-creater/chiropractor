const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { SuccessResponse, ErrorResponse } = require('../utils/httpResponses');
const { getPostgreSQLPool } = require('../config/database');
const { registerSchema, loginSchema } = require('../validators');

class AuthController {
  static async register(req, res) {
    try {
      console.log('🚀 Registration attempt:', { 
        email: req.body?.email, 
        role: req.body?.role || 'patient',
        hasFirstName: !!req.body?.first_name,
        hasLastName: !!req.body?.last_name
      });

      // Validate request body
      const { error, value } = registerSchema.validate(req.body);
      if (error) {
        console.log('❌ Validation error:', error.details[0].message);
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const { 
        email, 
        password, 
        confirm_password, 
        first_name, 
        last_name, 
        role = 'patient', // Default to patient if not specified
        specialization, 
        license_number, 
        phone_number 
      } = value;

      console.log('✅ Validation passed. Creating user with role:', role);

      // Check if PostgreSQL is available
      let pool;
      try {
        pool = getPostgreSQLPool();
      } catch (error) {
        console.error('❌ Database pool error:', error.message);
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      if (!pool) {
        console.error('❌ PostgreSQL pool is null');
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Begin transaction
        await client.query('BEGIN');
        console.log('📝 Transaction started');

        // Check if user already exists by email
        const existingUser = await client.query(
          'SELECT id, email, role FROM users WHERE email = $1',
          [email]
        );

        if (existingUser.rows.length > 0) {
          console.log('❌ User already exists:', email);
          throw new ErrorResponse('User with this email already exists', 409, '4091');
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('🔐 Password hashed successfully');

        // Create username from email (before @ symbol)
        const username = email.split('@')[0];

        // Insert user into users table
        const userResult = await client.query(
          `INSERT INTO users (email, username, password_hash, role, phone_number, status, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
           RETURNING id, email, username, role, phone_number, status, created_at`,
          [email, username, hashedPassword, role, phone_number]
        );

        const user = userResult.rows[0];
        console.log('✅ User created in users table:', { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          username: user.username 
        });

        // Create corresponding record in patients or doctors table based on role
        let profileRecord = null;

        if (role === 'patient') {
          console.log('👤 Creating patient profile...');
          const patientResult = await client.query(
            `INSERT INTO patients (
              user_id, first_name, last_name, email, phone, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
            RETURNING id, user_id, first_name, last_name, email, phone, status, created_at`,
            [user.id, first_name, last_name, email, phone_number]
          );
          
          profileRecord = patientResult.rows[0];
          console.log('✅ Patient profile created:', { 
            patient_id: profileRecord.id, 
            name: `${profileRecord.first_name} ${profileRecord.last_name}` 
          });

        } else if (role === 'doctor') {
          console.log('👨‍⚕️ Creating doctor profile...');
          const doctorResult = await client.query(
            `INSERT INTO doctors (
              user_id, first_name, last_name, specialization, license_number, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
            RETURNING id, user_id, first_name, last_name, specialization, license_number, status, created_at`,
            [user.id, first_name, last_name, specialization || null, license_number || null]
          );
          
          profileRecord = doctorResult.rows[0];
          console.log('✅ Doctor profile created:', { 
            doctor_id: profileRecord.id, 
            name: `${profileRecord.first_name} ${profileRecord.last_name}`,
            specialization: profileRecord.specialization 
          });

        } else if (role === 'staff') {
          console.log('👩‍💼 Creating staff profile...');
          // For staff, we can create a simple profile record
          const staffResult = await client.query(
            `INSERT INTO patients (
              user_id, first_name, last_name, email, phone, status, created_at, updated_at
            ) VALUES ($1, $2, $3, $4, $5, 'active', NOW(), NOW())
            RETURNING id, user_id, first_name, last_name, email, phone, status, created_at`,
            [user.id, first_name, last_name, email, phone_number]
          );
          
          profileRecord = staffResult.rows[0];
          console.log('✅ Staff profile created:', { 
            staff_id: profileRecord.id, 
            name: `${profileRecord.first_name} ${profileRecord.last_name}` 
          });
        }

        // Generate JWT token with comprehensive user data
        const tokenPayload = {
          user_id: user.id,
          email: user.email,
          role: user.role,
          username: user.username,
          profile_id: profileRecord?.id,
          first_name: first_name,
          last_name: last_name
        };

        const token = jwt.sign(
          tokenPayload,
          process.env.JWT_SECRET,
          { 
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            issuer: 'chiropractor-clinic',
            audience: 'clinic-users'
          }
        );

        console.log('🎫 JWT token generated successfully');

        // Store API key in database for session management
        try {
          await client.query(
            'INSERT INTO api_keys (user_id, key, expires_at, created_at) VALUES ($1, $2, $3, NOW())',
            [user.id, await bcrypt.hash(token, 8), new Date(Date.now() + 24 * 60 * 60 * 1000)]
          );
          console.log('🔑 API key stored for session management');
        } catch (apiKeyError) {
          console.warn('⚠️ Failed to store API key (non-critical):', apiKeyError.message);
          // Don't fail the registration if API key storage fails
        }

        // Commit transaction
        await client.query('COMMIT');
        console.log('✅ Transaction committed successfully');

        // Prepare response data
        const responseData = {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            first_name: first_name,
            last_name: last_name,
            role: user.role,
            phone_number: user.phone_number,
            status: user.status,
            created_at: user.created_at,
            // Include profile-specific data
            ...(role === 'doctor' && profileRecord && {
              doctor_id: profileRecord.id,
              specialization: profileRecord.specialization,
              license_number: profileRecord.license_number
            }),
            ...(role === 'patient' && profileRecord && {
              patient_id: profileRecord.id
            })
          },
          token,
          expires_in: process.env.JWT_EXPIRES_IN || '24h',
          // Add helpful metadata
          registration_type: role,
          profile_created: !!profileRecord
        };

        const response = new SuccessResponse('User registered successfully', 201, responseData);
        
        console.log('🎉 Registration completed successfully for:', {
          email: user.email,
          role: user.role,
          user_id: user.id,
          profile_id: profileRecord?.id
        });

        response.send(res);

      } catch (error) {
        await client.query('ROLLBACK');
        console.log('🔄 Transaction rolled back due to error');
        throw error;
      } finally {
        client.release();
        console.log('🔌 Database connection released');
      }

    } catch (error) {
      console.error('💥 Registration error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5),
        timestamp: new Date().toISOString()
      });

      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse(
          'Internal server error during registration. Please try again.', 
          500, 
          '5000'
        );
        errorResponse.send(res);
      }
    }
  }

  static async login(req, res) {
    try {
      console.log('Login attempt:', { email: req.body?.email });

      // Validate request body
      const { error, value } = loginSchema.validate(req.body);
      if (error) {
        console.log('Login validation error:', error.details[0].message);
        throw new ErrorResponse(`Validation error: ${error.details[0].message}`, 400, '4001');
      }

      const { email, password } = value;

      // Check if PostgreSQL is available
      let pool;
      try {
        pool = getPostgreSQLPool();
      } catch (error) {
        console.error('Database pool error:', error.message);
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      if (!pool) {
        console.error('PostgreSQL pool is null');
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Find user by email with profile data
        const userResult = await client.query(
          `SELECT u.id, u.email, u.username, u.password_hash, u.role, u.phone_number, u.status,
                  p.id as patient_id, p.first_name as patient_first_name, p.last_name as patient_last_name,
                  d.id as doctor_id, d.first_name as doctor_first_name, d.last_name as doctor_last_name, 
                  d.specialization, d.license_number
           FROM users u
           LEFT JOIN patients p ON u.id = p.user_id AND u.role IN ('patient', 'staff')
           LEFT JOIN doctors d ON u.id = d.user_id AND u.role = 'doctor'
           WHERE u.email = $1 AND u.status = 'active'`,
          [email]
        );

        if (userResult.rows.length === 0) {
          console.log('Login failed - user not found:', email);
          throw new ErrorResponse('Invalid email or password', 401, '4011');
        }

        const user = userResult.rows[0];

        // Check if user is active
        if (user.status !== 'active') {
          console.log('Login failed - user inactive:', email);
          throw new ErrorResponse('Account is inactive. Please contact administrator.', 401, '4012');
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
          console.log('Login failed - invalid password:', email);
          throw new ErrorResponse('Invalid email or password', 401, '4011');
        }

        console.log('Login successful:', { id: user.id, email: user.email, role: user.role });

        // Generate JWT token
        const token = jwt.sign(
          { 
            user_id: user.id, 
            email: user.email, 
            role: user.role 
          },
          process.env.JWT_SECRET,
          { 
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            issuer: 'chiropractor-clinic',
            audience: 'clinic-users'
          }
        );

        // Store API key in database for session management
        await client.query(
          'INSERT INTO api_keys (user_id, key, expires_at, created_at) VALUES ($1, $2, $3, NOW())',
          [user.id, await bcrypt.hash(token, 8), new Date(Date.now() + 24 * 60 * 60 * 1000)]
        );

        // Update last login
        await client.query(
          'UPDATE users SET last_login_at = NOW(), updated_at = NOW() WHERE id = $1',
          [user.id]
        );

        // Prepare user data based on role
        const first_name = user.role === 'patient' ? user.patient_first_name : user.doctor_first_name;
        const last_name = user.role === 'patient' ? user.patient_last_name : user.doctor_last_name;

        const response = new SuccessResponse('Login successful', 200, {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            first_name: first_name,
            last_name: last_name,
            role: user.role,
            phone_number: user.phone_number,
            specialization: user.specialization,
            license_number: user.license_number,
            status: user.status
          },
          token,
          expires_in: process.env.JWT_EXPIRES_IN || '24h'
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      console.error('Login error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 3)
      });

      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        const errorResponse = new ErrorResponse('Internal server error during login', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async refresh(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ErrorResponse('No token provided', 401, '4013');
      }

      const token = authHeader.substring(7);

      // Verify the current token (even if expired, we can refresh it)
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
      } catch (error) {
        throw new ErrorResponse('Invalid token', 401, '4014');
      }

      let pool;
      try {
        pool = getPostgreSQLPool();
      } catch (error) {
        console.error('Database pool error:', error.message);
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Verify user still exists and is active with profile data
        const userResult = await client.query(
          `SELECT u.id, u.email, u.username, u.role, u.phone_number, u.status,
                  p.first_name as patient_first_name, p.last_name as patient_last_name,
                  d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization, d.license_number
           FROM users u
           LEFT JOIN patients p ON u.id = p.user_id AND u.role = 'patient'
           LEFT JOIN doctors d ON u.id = d.user_id AND u.role = 'doctor'
           WHERE u.id = $1`,
          [decoded.user_id || decoded.userId] // Support both formats for backward compatibility
        );

        if (userResult.rows.length === 0 || userResult.rows[0].status !== 'active') {
          throw new ErrorResponse('User not found or inactive', 401, '4015');
        }

        const user = userResult.rows[0];

        // Generate new JWT token
        const newToken = jwt.sign(
          { 
            user_id: user.id, 
            email: user.email, 
            role: user.role 
          },
          process.env.JWT_SECRET,
          { 
            expiresIn: process.env.JWT_EXPIRES_IN || '24h',
            issuer: 'chiropractor-clinic',
            audience: 'clinic-users'
          }
        );

        // Store new API key
        await client.query(
          'INSERT INTO api_keys (user_id, key, expires_at, created_at) VALUES ($1, $2, $3, NOW())',
          [user.id, await bcrypt.hash(newToken, 8), new Date(Date.now() + 24 * 60 * 60 * 1000)]
        );

        // Optionally clean up old expired tokens
        await client.query(
          'DELETE FROM api_keys WHERE user_id = $1 AND expires_at < NOW()',
          [user.id]
        );

        // Prepare user data based on role
        const first_name = user.role === 'patient' ? user.patient_first_name : user.doctor_first_name;
        const last_name = user.role === 'patient' ? user.patient_last_name : user.doctor_last_name;

        const response = new SuccessResponse('Token refreshed successfully', 200, {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            first_name: first_name,
            last_name: last_name,
            role: user.role,
            phone_number: user.phone_number,
            specialization: user.specialization,
            license_number: user.license_number,
            status: user.status
          },
          token: newToken,
          expires_in: process.env.JWT_EXPIRES_IN || '24h'
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else {
        console.error('Token refresh error:', error);
        const errorResponse = new ErrorResponse('Internal server error during token refresh', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  static async logout(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
          
          const pool = getPostgreSQLPool();
          if (pool) {
            const client = await pool.connect();
            try {
              // Remove the specific API key from database
              const tokenHash = await bcrypt.hash(token, 8);
              await client.query(
                'DELETE FROM api_keys WHERE user_id = $1 AND key = $2',
                [decoded.user_id || decoded.userId, tokenHash]
              );
            } finally {
              client.release();
            }
          }
        } catch (error) {
          // Token might be invalid, but that's okay for logout
          console.warn('Token verification failed during logout:', error.message);
        }
      }

      const response = new SuccessResponse('Logged out successfully', 200, {
        message: 'Session terminated'
      });
      response.send(res);

    } catch (error) {
      console.error('Logout error:', error);
      // Always succeed logout, even if there are errors
      const response = new SuccessResponse('Logged out successfully', 200, {
        message: 'Session terminated'
      });
      response.send(res);
    }
  }

  static async verify(req, res) {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new ErrorResponse('No token provided', 401, '4013');
      }

      const token = authHeader.substring(7);

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      let pool;
      try {
        pool = getPostgreSQLPool();
      } catch (error) {
        console.error('Database pool error:', error.message);
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      if (!pool) {
        throw new ErrorResponse('Database connection not available', 503, '5030');
      }

      const client = await pool.connect();

      try {
        // Verify user still exists and is active with profile data
        const userResult = await client.query(
          `SELECT u.id, u.email, u.username, u.role, u.phone_number, u.status,
                  p.first_name as patient_first_name, p.last_name as patient_last_name,
                  d.first_name as doctor_first_name, d.last_name as doctor_last_name, d.specialization, d.license_number
           FROM users u
           LEFT JOIN patients p ON u.id = p.user_id AND u.role = 'patient'
           LEFT JOIN doctors d ON u.id = d.user_id AND u.role = 'doctor'
           WHERE u.id = $1`,
          [decoded.user_id || decoded.userId]
        );

        if (userResult.rows.length === 0 || userResult.rows[0].status !== 'active') {
          throw new ErrorResponse('User not found or inactive', 401, '4015');
        }

        const user = userResult.rows[0];

        // Prepare user data based on role
        const first_name = user.role === 'patient' ? user.patient_first_name : user.doctor_first_name;
        const last_name = user.role === 'patient' ? user.patient_last_name : user.doctor_last_name;

        const response = new SuccessResponse('Token is valid', 200, {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            first_name: first_name,
            last_name: last_name,
            role: user.role,
            phone_number: user.phone_number,
            specialization: user.specialization,
            license_number: user.license_number,
            status: user.status
          },
          token_valid: true,
          expires_at: new Date(decoded.exp * 1000)
        });

        response.send(res);

      } finally {
        client.release();
      }

    } catch (error) {
      if (error instanceof ErrorResponse) {
        error.send(res);
      } else if (error.name === 'JsonWebTokenError') {
        const errorResponse = new ErrorResponse('Invalid token', 401, '4014');
        errorResponse.send(res);
      } else if (error.name === 'TokenExpiredError') {
        const errorResponse = new ErrorResponse('Token expired', 401, '4016');
        errorResponse.send(res);
      } else {
        console.error('Token verification error:', error);
        const errorResponse = new ErrorResponse('Internal server error during token verification', 500, '5000');
        errorResponse.send(res);
      }
    }
  }

  // Test endpoint for easy registration testing
  static async testRegistration(req, res) {
    try {
      console.log('🧪 Test registration endpoint called');
      
      // Sample test data
      const testUsers = [
        {
          first_name: "John",
          last_name: "Doe",
          email: "patient@test.com",
          password: "password123",
          confirm_password: "password123",
          phone_number: "555-123-4567",
          role: "patient"
        },
        {
          first_name: "Dr. Jane",
          last_name: "Smith",
          email: "doctor@test.com", 
          password: "password123",
          confirm_password: "password123",
          phone_number: "555-987-6543",
          role: "doctor",
          specialization: "Chiropractic",
          license_number: "DC123456"
        }
      ];

      const results = [];
      
      for (const testUser of testUsers) {
        try {
          // Create a mock request object
          const mockReq = { body: testUser };
          let result = null;
          
          // Create a mock response object that captures the response
          const mockRes = {
            status: function(code) { 
              this.statusCode = code; 
              return this; 
            },
            json: function(data) { 
              result = { statusCode: this.statusCode, data }; 
              return this; 
            }
          };

          await AuthController.register(mockReq, mockRes);
          results.push({ 
            email: testUser.email, 
            role: testUser.role, 
            status: 'success', 
            result 
          });
          
        } catch (error) {
          results.push({ 
            email: testUser.email, 
            role: testUser.role, 
            status: 'error', 
            error: error.message 
          });
        }
      }

      const response = new SuccessResponse('Test registration completed', 200, {
        message: 'Test users registration attempted',
        results,
        note: 'This is a test endpoint. Remove in production.'
      });

      response.send(res);

    } catch (error) {
      console.error('Test registration error:', error);
      const errorResponse = new ErrorResponse('Test registration failed', 500, '5000');
      errorResponse.send(res);
    }
  }
}

module.exports = AuthController; 