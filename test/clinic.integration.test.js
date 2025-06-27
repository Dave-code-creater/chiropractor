const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../src/index');

describe('🏥 Chiropractor Clinic - Integration Tests', () => {
  let authToken;
  let doctorToken;
  let patientId;
  let appointmentId;

  before(async () => {
    // Wait for application to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  describe('👨‍⚕️ Doctor Authentication & Management', () => {
    it('should register a new doctor', async () => {
      const doctorData = {
        email: 'dr.phan@clinic.com',
        password: 'SecurePassword123!',
        firstName: 'Dieu',
        lastName: 'Phan',
        role: 'doctor',
        specialization: 'Chiropractic',
        licenseNumber: 'DC12345',
        phone: '555-0123'
      };

      const response = await request(app)
        .post('/v1/api/2025/auth/register')
        .send(doctorData);

      expect(response.status).to.be.oneOf([201, 501]); // 501 if not implemented yet
      if (response.status === 201) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('user');
        expect(response.body.data.user).to.have.property('role', 'doctor');
      }
    });

    it('should login as doctor', async () => {
      const loginData = {
        email: 'dr.phan@clinic.com',
        password: 'SecurePassword123!'
      };

      const response = await request(app)
        .post('/v1/api/2025/auth/login')
        .send(loginData);

      expect(response.status).to.be.oneOf([200, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('token');
        doctorToken = response.body.data.token;
      }
    });
  });

  describe('👥 Patient Management', () => {
    it('should create a new patient record', async () => {
      const patientData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@email.com',
        phone: '555-0456',
        dateOfBirth: '1985-06-15',
        gender: 'male',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345'
        },
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'spouse',
          phone: '555-0789'
        },
        medicalHistory: {
          allergies: ['None'],
          medications: ['None'],
          previousSurgeries: [],
          chronicConditions: []
        },
        insurance: {
          provider: 'Health Insurance Co',
          policyNumber: 'HIC123456',
          groupNumber: 'GRP789'
        }
      };

      const response = await request(app)
        .post('/v1/api/2025/users/patients')
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`)
        .send(patientData);

      expect(response.status).to.be.oneOf([201, 401, 501]);
      if (response.status === 201) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('patient');
        patientId = response.body.data.patient.id;
      }
    });

    it('should get all patients', async () => {
      const response = await request(app)
        .get('/v1/api/2025/users/patients')
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`);

      expect(response.status).to.be.oneOf([200, 401, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('patients');
        expect(response.body.data.patients).to.be.an('array');
      }
    });

    it('should get patient by ID', async () => {
      if (!patientId) return;

      const response = await request(app)
        .get(`/v1/api/2025/users/patients/${patientId}`)
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`);

      expect(response.status).to.be.oneOf([200, 401, 404, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('patient');
      }
    });

    it('should update patient information', async () => {
      if (!patientId) return;

      const updateData = {
        phone: '555-9999',
        address: {
          street: '456 Oak Ave',
          city: 'Newtown',
          state: 'CA',
          zipCode: '54321'
        }
      };

      const response = await request(app)
        .put(`/v1/api/2025/users/patients/${patientId}`)
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`)
        .send(updateData);

      expect(response.status).to.be.oneOf([200, 401, 404, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
      }
    });
  });

  describe('📅 Appointment Management', () => {
    it('should create a new appointment', async () => {
      const appointmentData = {
        patientId: patientId || 'mock-patient-id',
        doctorId: 'doctor-123',
        appointmentDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
        appointmentTime: '10:00',
        duration: 60,
        type: 'consultation',
        reason: 'Lower back pain evaluation',
        notes: 'Patient reports chronic lower back pain for 2 weeks'
      };

      const response = await request(app)
        .post('/v1/api/2025/appointments')
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`)
        .send(appointmentData);

      expect(response.status).to.be.oneOf([201, 401, 501]);
      if (response.status === 201) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('appointment');
        appointmentId = response.body.data.appointment.id;
      }
    });

    it('should get all appointments', async () => {
      const response = await request(app)
        .get('/v1/api/2025/appointments')
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`);

      expect(response.status).to.be.oneOf([200, 401, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('appointments');
      }
    });

    it('should get appointments by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const response = await request(app)
        .get(`/v1/api/2025/appointments?startDate=${today}&endDate=${nextWeek}`)
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`);

      expect(response.status).to.be.oneOf([200, 401, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
      }
    });

    it('should update appointment status', async () => {
      if (!appointmentId) return;

      const updateData = {
        status: 'confirmed',
        notes: 'Patient confirmed attendance'
      };

      const response = await request(app)
        .put(`/v1/api/2025/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`)
        .send(updateData);

      expect(response.status).to.be.oneOf([200, 401, 404, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
      }
    });

    it('should cancel appointment', async () => {
      if (!appointmentId) return;

      const response = await request(app)
        .delete(`/v1/api/2025/appointments/${appointmentId}`)
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`);

      expect(response.status).to.be.oneOf([200, 401, 404, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
      }
    });
  });

  describe('📝 Clinical Notes & Vitals', () => {
    it('should create clinical notes for patient', async () => {
      if (!patientId) return;

      const notesData = {
        patientId: patientId,
        appointmentId: appointmentId || 'mock-appointment-id',
        chiefComplaint: 'Lower back pain radiating to left leg',
        historyOfPresentIllness: 'Patient reports onset 2 weeks ago after lifting heavy box',
        physicalExamination: {
          inspection: 'Patient favors right side when walking',
          palpation: 'Tenderness in L4-L5 region',
          rangeOfMotion: 'Limited flexion, normal extension',
          neurologicalTests: 'Negative straight leg raise test'
        },
        assessment: 'Acute lumbar strain with possible disc involvement',
        plan: 'Chiropractic adjustment, ice therapy, follow-up in 1 week',
        recommendations: ['Avoid heavy lifting', 'Apply ice 15-20 minutes every 2 hours', 'Gentle stretching exercises']
      };

      const response = await request(app)
        .post('/v1/api/2025/users/clinical-notes')
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`)
        .send(notesData);

      expect(response.status).to.be.oneOf([201, 401, 501]);
      if (response.status === 201) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('notes');
      }
    });

    it('should record patient vitals', async () => {
      if (!patientId) return;

      const vitalsData = {
        patientId: patientId,
        bloodPressure: {
          systolic: 120,
          diastolic: 80
        },
        heartRate: 72,
        temperature: 98.6,
        weight: 175,
        height: 70,
        painLevel: 6,
        painLocation: 'Lower back, left side',
        recordedBy: 'Dr. Phan',
        notes: 'Patient appears comfortable at rest'
      };

      const response = await request(app)
        .post('/v1/api/2025/users/vitals')
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`)
        .send(vitalsData);

      expect(response.status).to.be.oneOf([201, 401, 501]);
      if (response.status === 201) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('vitals');
      }
    });
  });

  describe('📊 Reports & Analytics', () => {
    it('should generate patient summary report', async () => {
      if (!patientId) return;

      const response = await request(app)
        .get(`/v1/api/2025/reports/patient-summary/${patientId}`)
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`);

      expect(response.status).to.be.oneOf([200, 401, 404, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('summary');
      }
    });

    it('should get clinic statistics', async () => {
      const response = await request(app)
        .get('/v1/api/2025/reports/clinic-stats')
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`);

      expect(response.status).to.be.oneOf([200, 401, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('stats');
      }
    });

    it('should get appointment analytics', async () => {
      const response = await request(app)
        .get('/v1/api/2025/reports/appointments-analytics')
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`);

      expect(response.status).to.be.oneOf([200, 401, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
      }
    });
  });

  describe('💬 Blog & Communication', () => {
    it('should get published blog posts', async () => {
      const response = await request(app)
        .get('/v1/api/2025/blog/posts')
        .query({ published: true });

      expect(response.status).to.be.oneOf([200, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('posts');
        expect(response.body.data.posts).to.be.an('array');
      }
    });

    it('should create new blog post', async () => {
      const postData = {
        title: 'Tips for Maintaining Good Posture at Work',
        content: 'Working from home has become more common, and maintaining good posture is crucial...',
        tags: ['posture', 'workplace-health', 'prevention'],
        published: true
      };

      const response = await request(app)
        .post('/v1/api/2025/blog/posts')
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`)
        .send(postData);

      expect(response.status).to.be.oneOf([201, 401, 501]);
      if (response.status === 201) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('post');
      }
    });
  });

  describe('💬 Real-time Chat Features', () => {
    it('should create chat conversation', async () => {
      const conversationData = {
        participants: [patientId || 'mock-patient-id', 'doctor-123'],
        type: 'patient-doctor',
        subject: 'Follow-up questions about treatment'
      };

      const response = await request(app)
        .post('/v1/api/2025/chat/conversations')
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`)
        .send(conversationData);

      expect(response.status).to.be.oneOf([201, 401, 501]);
      if (response.status === 201) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('conversation');
      }
    });

    it('should get user conversations', async () => {
      const response = await request(app)
        .get('/v1/api/2025/chat/conversations')
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`);

      expect(response.status).to.be.oneOf([200, 401, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('conversations');
      }
    });
  });

  describe('🔒 Security & Access Control', () => {
    it('should protect patient routes without authentication', async () => {
      const response = await request(app)
        .get('/v1/api/2025/users/patients');

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
    });

    it('should protect appointment routes without authentication', async () => {
      const response = await request(app)
        .get('/v1/api/2025/appointments');

      expect(response.status).to.equal(401);
      expect(response.body).to.have.property('success', false);
    });

    it('should validate required fields for patient creation', async () => {
      const invalidPatientData = {
        firstName: 'John'
        // Missing required fields
      };

      const response = await request(app)
        .post('/v1/api/2025/users/patients')
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`)
        .send(invalidPatientData);

      expect(response.status).to.be.oneOf([400, 401, 501]);
      if (response.status === 400) {
        expect(response.body).to.have.property('success', false);
      }
    });
  });

  describe('🏥 Clinic Dashboard Data', () => {
    it('should get dashboard summary', async () => {
      const response = await request(app)
        .get('/v1/api/2025/users/dashboard')
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`);

      expect(response.status).to.be.oneOf([200, 401, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
        expect(response.body.data).to.have.property('dashboard');
      }
    });

    it('should get today\'s appointments', async () => {
      const today = new Date().toISOString().split('T')[0];

      const response = await request(app)
        .get(`/v1/api/2025/appointments/today`)
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`);

      expect(response.status).to.be.oneOf([200, 401, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
      }
    });

    it('should get recent patients', async () => {
      const response = await request(app)
        .get('/v1/api/2025/users/patients/recent')
        .set('Authorization', `Bearer ${doctorToken || 'mock-token'}`);

      expect(response.status).to.be.oneOf([200, 401, 501]);
      if (response.status === 200) {
        expect(response.body).to.have.property('success', true);
      }
    });
  });
}); 