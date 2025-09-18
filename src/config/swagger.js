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
          required: ['email', 'password', 'first_name', 'last_name'],
          properties: {
            email: { type: 'string', format: 'email', example: 'doctor@clinic.com' },
            password: { type: 'string', minLength: 8, example: 'Str0ngPass!23' },
            first_name: { type: 'string', example: 'Sarah' },
            last_name: { type: 'string', example: 'Smith' },
            phone_number: { type: 'string', example: '+1-555-123-9876' },
            role: { type: 'string', enum: ['patient', 'doctor', 'admin'], example: 'doctor' },
            specialization: { type: 'string', example: 'Chiropractic Medicine' }
          },
        },
        PatientRegisterRequest: {
          type: 'object',
          required: ['first_name', 'last_name', 'phone_number', 'email', 'password', 'confirm_password'],
          properties: {
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            phone_number: { type: 'string', example: '+1-555-111-2222' },
            email: { type: 'string', format: 'email', example: 'john.doe@example.com' },
            password: { type: 'string', minLength: 8, example: 'SecurePass!1' },
            confirm_password: { type: 'string', minLength: 8, example: 'SecurePass!1' }
          },
        },
        RefreshTokenRequest: {
          type: 'object',
          required: ['refresh_token'],
          properties: {
            refresh_token: { type: 'string', example: 'dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4=' }
          },
        },
        ForgotPasswordRequest: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' }
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['token', 'new_password', 'confirm_new_password'],
          properties: {
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            new_password: { type: 'string', minLength: 8, example: 'NewPass!123' },
            confirm_new_password: { type: 'string', minLength: 8, example: 'NewPass!123' }
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
        BlogPostRequest: {
          type: 'object',
          required: ['title', 'content', 'category'],
          properties: {
            title: { type: 'string', example: 'How Chiropractic Care Improves Posture' },
            content: {
              type: 'array',
              items: {
                type: 'object',
                required: ['type', 'text'],
                properties: {
                  type: { type: 'string', example: 'paragraph' },
                  text: { type: 'string', example: 'Regular chiropractic adjustments can help...' }
                }
              }
            },
            excerpt: { type: 'string', example: 'Discover key benefits of chiropractic adjustments.' },
            category: { type: 'string', example: 'wellness' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              example: ['posture', 'pain-relief']
            },
            is_published: { type: 'boolean', example: true },
            featured_image: { type: 'string', example: 'https://cdn.example.com/images/posture.jpg' },
            meta_description: { type: 'string', example: 'Learn how chiropractic care keeps your spine healthy.' },
            slug: { type: 'string', example: 'chiropractic-care-improves-posture' }
          },
        },
        ChatConversationRequest: {
          type: 'object',
          required: ['target_user_id', 'subject'],
          properties: {
            target_user_id: { type: 'integer', example: 24 },
            conversation_type: { type: 'string', enum: ['consultation', 'general', 'urgent', 'follow-up'], example: 'consultation' },
            subject: { type: 'string', example: 'Post-treatment follow-up' },
            priority: { type: 'string', enum: ['low', 'normal', 'high', 'urgent'], example: 'high' },
            initial_message: { type: 'string', example: 'Hi doctor, I have a few questions about today’s session.' }
          },
        },
        ChatMessageRequest: {
          type: 'object',
          required: ['content'],
          properties: {
            content: { type: 'string', example: 'Please remember to do the stretches twice daily.' },
            message_type: { type: 'string', enum: ['text', 'system'], example: 'text' }
          },
        },
        ConversationStatusRequest: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['active', 'archived', 'closed'], example: 'archived' }
          },
        },
        PatientCreateRequest: {
          type: 'object',
          required: ['first_name', 'last_name', 'email'],
          properties: {
            first_name: { type: 'string', example: 'Jane' },
            middle_name: { type: 'string', example: 'A.' },
            last_name: { type: 'string', example: 'Doe' },
            email: { type: 'string', format: 'email', example: 'jane.doe@example.com' },
            phone_number: { type: 'string', example: '+1-555-222-3333' },
            date_of_birth: { type: 'string', format: 'date', example: '1985-04-12' },
            gender: { type: 'string', example: 'female' },
            marriage_status: { type: 'string', example: 'Married' },
            race: { type: 'string', example: 'Asian' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string', example: '123 Main St' },
                city: { type: 'string', example: 'Austin' },
                state: { type: 'string', example: 'TX' },
                zip_code: { type: 'string', example: '73301' }
              }
            },
            emergency_contact: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'John Doe' },
                phone_number: { type: 'string', example: '+1-555-444-5555' },
                relationship: { type: 'string', example: 'Spouse' }
              }
            },
            insurance_info: { type: 'object', example: { provider: 'Blue Shield', policy_number: 'ABC123' } },
            medical_history: { type: 'object', example: { allergies: ['Peanuts'] } }
          },
        },
        PatientUpdateRequest: {
          type: 'object',
          properties: {
            first_name: { type: 'string' },
            middle_name: { type: 'string' },
            last_name: { type: 'string' },
            email: { type: 'string', format: 'email' },
            phone_number: { type: 'string' },
            date_of_birth: { type: 'string', format: 'date' },
            gender: { type: 'string' },
            marriage_status: { type: 'string' },
            race: { type: 'string' },
            address: {
              type: 'object',
              properties: {
                street: { type: 'string' },
                city: { type: 'string' },
                state: { type: 'string' },
                zip_code: { type: 'string' }
              }
            },
            emergency_contact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone_number: { type: 'string' },
                relationship: { type: 'string' }
              }
            },
            insurance_info: { type: 'object' },
            medical_history: { type: 'object' }
          },
        },
        ClinicalNoteRequest: {
          type: 'object',
          required: ['patient_id'],
          properties: {
            patient_id: { type: 'integer', example: 42 },
            appointment_id: { type: 'integer', example: 120 },
            note_type: { type: 'string', enum: ['Progress Note', 'Initial Consultation', 'Follow-up', 'Treatment Note'], example: 'Progress Note' },
            chief_complaint: { type: 'string', example: 'Lower back pain after lifting' },
            history_of_present_illness: { type: 'string', example: 'Pain started 3 days ago after moving furniture.' },
            physical_examination: { type: 'object', example: { range_of_motion: 'Limited' } },
            assessment: { type: 'string', example: 'Lumbar strain' },
            treatment: { type: 'string', example: 'Performed spinal adjustment and prescribed exercises.' },
            plan: { type: 'string', example: 'Follow up in one week' },
            recommendations: { type: 'array', items: { type: 'string' }, example: ['Apply ice twice daily'] },
            duration_minutes: { type: 'integer', example: 45 },
            doctor_id: { type: 'string', example: 'DOC-1001' },
            doctor_name: { type: 'string', example: 'Dr. Sarah Smith' },
            status: { type: 'string', enum: ['draft', 'completed', 'reviewed'], example: 'completed' }
          },
        },
        ProfileUpdateRequest: {
          type: 'object',
          properties: {
            first_name: { type: 'string', example: 'Sarah' },
            middle_name: { type: 'string', example: 'Ann' },
            last_name: { type: 'string', example: 'Smith' },
            date_of_birth: { type: 'string', format: 'date', example: '1982-02-10' },
            gender: { type: 'string', example: 'female' },
            marriage_status: { type: 'string', example: 'Married' },
            race: { type: 'string', example: 'Hispanic' },
            phone: { type: 'string', example: '+1-555-666-7777' },
            email: { type: 'string', example: 'sarah.smith@clinic.com' },
            street: { type: 'string', example: '456 Wellness Way' },
            city: { type: 'string', example: 'Seattle' },
            state: { type: 'string', example: 'WA' },
            zip: { type: 'string', example: '98101' },
            employer: { type: 'string', example: 'HealthWorks' },
            occupation: { type: 'string', example: 'Chiropractor' },
            work_address: { type: 'string', example: '200 Medical Plaza' },
            work_phone: { type: 'string', example: '+1-555-888-9999' },
            spouse_phone: { type: 'string', example: '+1-555-000-1111' },
            emergency_contact_name: { type: 'string', example: 'Mark Smith' },
            emergency_contact_phone: { type: 'string', example: '+1-555-121-3434' },
            emergency_contact_relationship: { type: 'string', example: 'Spouse' }
          },
        },
        IncidentCreateRequest: {
          type: 'object',
          required: ['incident_type', 'title'],
          properties: {
            incident_type: {
              type: 'string',
              enum: ['car_accident', 'work_injury', 'sports_injury', 'general_pain', 'general_patient_record'],
              example: 'car_accident'
            },
            title: { type: 'string', example: 'Rear-end accident on I-35' },
            description: { type: 'string', example: 'Patient experienced whiplash after being rear-ended.' },
            incident_date: { type: 'string', format: 'date', example: '2025-05-14' },
            doctor_id: { type: 'integer', example: 12 }
          },
        },
        IncidentUpdateRequest: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Updated accident report' },
            description: { type: 'string', example: 'Additional details about the accident' },
            incident_date: { type: 'string', format: 'date', example: '2025-05-13' },
            status: { type: 'string', enum: ['active', 'completed', 'inactive'], example: 'completed' }
          },
        },
        IncidentFormRequest: {
          type: 'object',
          properties: {
            form_type: {
              type: 'string',
              enum: ['patient_info', 'health_insurance', 'pain_description', 'pain_assessment', 'medical_history', 'lifestyle_impact'],
              example: 'patient_info'
            },
            form_data: { type: 'object', example: { employer: 'Tech Corp', job_title: 'Designer' } },
            is_completed: { type: 'boolean', example: true }
          },
        },
        IncidentNoteRequest: {
          type: 'object',
          required: ['note_text'],
          properties: {
            note_text: { type: 'string', example: 'Patient reports reduced pain after second session.' },
            note_type: { type: 'string', enum: ['progress', 'symptom_update', 'treatment_response', 'general'], example: 'progress' }
          },
        },
        TreatmentPlanRequest: {
          type: 'object',
          required: ['diagnosis', 'treatment_goals'],
          properties: {
            diagnosis: { type: 'string', example: 'Cervical strain' },
            treatment_goals: { type: 'string', example: 'Restore range of motion and reduce pain to 2/10' },
            additional_notes: { type: 'string', example: 'Patient to avoid heavy lifting for 2 weeks.' },
            treatment_phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  duration: { type: 'integer', example: 2 },
                  duration_type: { type: 'string', example: 'weeks' },
                  frequency: { type: 'integer', example: 3 },
                  frequency_type: { type: 'string', example: 'per_week' },
                  description: { type: 'string', example: 'Adjustment and muscle therapy' }
                }
              }
            }
          },
        },
        TreatmentPlanUpdateRequest: {
          type: 'object',
          properties: {
            diagnosis: { type: 'string', example: 'Cervical strain - improving' },
            treatment_goals: { type: 'string', example: 'Maintain range of motion' },
            additional_notes: { type: 'string', example: 'Introduce strengthening exercises' },
            status: { type: 'string', enum: ['active', 'completed', 'archived'], example: 'active' },
            treatment_phases: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'integer', example: 5 },
                  duration: { type: 'integer', example: 3 },
                  duration_type: { type: 'string', example: 'weeks' },
                  frequency: { type: 'integer', example: 2 },
                  frequency_type: { type: 'string', example: 'per_week' },
                  description: { type: 'string', example: 'Rehabilitation exercises' },
                  status: { type: 'string', enum: ['pending', 'in_progress', 'completed'], example: 'in_progress' }
                }
              }
            }
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
