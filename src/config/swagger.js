const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Chiropractor Clinic API',
      version: '1.0.0',
      description: 'A comprehensive API for managing a chiropractor clinic with patient appointments, medical records, and administration',
      contact: {
        name: 'Clinic Admin',
        email: 'admin@clinic.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: process.env.API_BASE_URL || 'http://localhost:3000/api/v1/2025',
        description: 'Development server',
      },
      {
        url: 'https://api.clinic.com/api/v1/2025',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from login endpoint',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'accessToken',
          description: 'JWT token stored in httpOnly cookie',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            username: { type: 'string', example: 'johndoe' },
            role: { type: 'string', enum: ['admin', 'doctor', 'staff', 'patient'], example: 'patient' },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Patient: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
            phone: { type: 'string', example: '+1-555-123-4567' },
            date_of_birth: { type: 'string', format: 'date', example: '1990-01-15' },
            gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'male' },
            address: { type: 'string', example: '123 Main St, City, State 12345' },
            emergency_contact_name: { type: 'string', example: 'Jane Doe' },
            emergency_contact_phone: { type: 'string', example: '+1-555-987-6543' },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
            user_id: { type: 'integer', example: 1 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Doctor: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            first_name: { type: 'string', example: 'Dr. Sarah' },
            last_name: { type: 'string', example: 'Smith' },
            specialization: { type: 'string', example: 'Chiropractic Medicine' },
            years_of_experience: { type: 'integer', example: 10 },
            email: { type: 'string', format: 'email', example: 'dr.smith@clinic.com' },
            phone_number: { type: 'string', example: '+1-555-111-2222' },
            office_address: { type: 'string', example: 'Suite 200, Medical Center' },
            status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
            is_available: { type: 'boolean', example: true },
            user_id: { type: 'integer', example: 2 },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            appointment_datetime: { type: 'string', format: 'date-time', example: '2025-06-26T11:30:00Z' },
            appointment_date: { type: 'string', format: 'date', example: '2025-06-26' },
            appointment_time: { type: 'string', example: '11:30 AM' },
            status: {
              type: 'string',
              enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
              example: 'scheduled'
            },
            location: { type: 'string', example: 'main_office' },
            reason_for_visit: { type: 'string', example: 'Back pain consultation' },
            additional_notes: { type: 'string', example: 'Patient experiencing lower back pain for 2 weeks' },
            patient: { $ref: '#/components/schemas/Patient' },
            doctor: { $ref: '#/components/schemas/Doctor' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 50 },
            totalPages: { type: 'integer', example: 5 },
            hasNext: { type: 'boolean', example: true },
            hasPrevious: { type: 'boolean', example: false },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operation completed successfully' },
            data: { type: 'object' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Data retrieved successfully' },
            data: {
              type: 'object',
              properties: {
                data: { type: 'array', items: {} },
                pagination: { $ref: '#/components/schemas/Pagination' },
                meta: { type: 'object' },
              },
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'An error occurred' },
            statusCode: { type: 'integer', example: 400 },
            errorCode: { type: 'string', example: '4000' },
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', minLength: 6, example: 'securePassword123' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'username'],
          properties: {
            email: { type: 'string', format: 'email', example: 'newuser@example.com' },
            password: { type: 'string', minLength: 6, example: 'securePassword123' },
            username: { type: 'string', minLength: 3, example: 'newuser' },
            role: { type: 'string', enum: ['patient'], default: 'patient' },
          },
        },
        CreateAppointmentRequest: {
          type: 'object',
          required: ['doctor_id', 'patient_id', 'appointment_date', 'appointment_time'],
          properties: {
            doctor_id: { type: 'integer', example: 1 },
            patient_id: { type: 'integer', example: 1 },
            appointment_date: { type: 'string', example: 'Thursday, June 26, 2025' },
            appointment_time: { type: 'string', example: '11:30 AM' },
            location: { type: 'string', example: 'main_office' },
            reason_for_visit: { type: 'string', example: 'Back pain consultation' },
            additional_notes: { type: 'string', example: 'Patient experiencing lower back pain' },
            status: {
              type: 'string',
              enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
              default: 'scheduled'
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
      {
        cookieAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.js', // Path to the API routes
    './src/controllers/*.js', // Path to controllers for additional documentation
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;