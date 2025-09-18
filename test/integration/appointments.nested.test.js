process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-here-minimum-32-chars';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../../src/index');
const { connectPostgreSQL, getPostgreSQLPool, closePostgreSQLPool } = require('../../src/config/database');
const { repositoryFactory } = require('../../src/repositories');

const PATIENT_TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJlbWFpbCI6ImphbmUuZG9lQGV4YW1wbGUuY29tIiwicm9sZSI6InBhdGllbnQiLCJ1c2VybmFtZSI6ImphbmVkb2UiLCJzdGF0dXMiOiJhY3RpdmUiLCJ0eXBlIjoiYWNjZXNzIiwicHJvZmlsZV9pZCI6MSwiZmlyc3RfbmFtZSI6IkphbmUiLCJsYXN0X25hbWUiOiJEb2UiLCJpYXQiOjE3NTgyMjA3MzIsImV4cCI6MTc2MDgxMjczMiwiYXVkIjoiY2xpbmljLXVzZXJzIiwiaXNzIjoiY2hpcm9wcmFjdG9yLWNsaW5pYyJ9.9iUTn3-uv5gU33pBV6FOeyXDlNCmOS7PvPoSfIvvikg';
const DOCTOR_TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyLCJlbWFpbCI6ImRvY3RvckBnbWFpbC5jb20iLCJyb2xlIjoiZG9jdG9yIiwidXNlcm5hbWUiOiJkb2N0b3IiLCJzdGF0dXMiOiJhY3RpdmUiLCJ0eXBlIjoiYWNjZXNzIiwicHJvZmlsZV9pZCI6MSwiZmlyc3RfbmFtZSI6IkRpZXUiLCJsYXN0X25hbWUiOiJQaGFuIiwiaWF0IjoxNzU4MjIwNzM5LCJleHAiOjE3NjA4MTI3MzksImF1ZCI6ImNsaW5pYy11c2VycyIsImlzcyI6ImNoaXJvcHJhY3Rvci1jbGluaWMifQ.v969KHmjx0FF8OlAI5qkqvNl4Zj0JJlu7HpQS0flz4A';

describe('Appointments API - nested routes', () => {
  let pool;
  let patientId;
  let appointmentId;
  let managedAppointmentId;
  const createdAppointmentIds = [];

  before(async () => {
    await connectPostgreSQL();
    repositoryFactory.clearInstances();
    pool = getPostgreSQLPool();

    const { rows } = await pool.query(`
      SELECT p.id
      FROM patients p
      INNER JOIN users u ON u.id = p.user_id
      WHERE u.email = 'jane.doe@example.com'
      LIMIT 1;
    `);

    if (!rows.length) {
      throw new Error('Seed patient not found. Did you run the migrations?');
    }

    patientId = rows[0].id;

    const appointmentResult = await pool.query(
      'SELECT id FROM appointments WHERE patient_id = $1 ORDER BY appointment_date LIMIT 1;',
      [patientId]
    );

    if (!appointmentResult.rows.length) {
      throw new Error('Seed appointment not found for patient.');
    }

    appointmentId = appointmentResult.rows[0].id;

    await pool.query(
      `
        UPDATE appointments
        SET appointment_date = DATE '2025-01-15',
            appointment_time = TIME '10:00',
            status = 'scheduled',
            location = 'main_office',
            additional_notes = 'Seeded test appointment',
            cancellation_reason = NULL,
            cancelled_at = NULL
        WHERE id = $1;
      `,
      [appointmentId]
    );
  });

  after(async () => {
    if (pool) {
      if (createdAppointmentIds.length > 0) {
        await pool.query('DELETE FROM appointments WHERE id = ANY($1)', [createdAppointmentIds]);
      }
      await closePostgreSQLPool();
      repositoryFactory.clearInstances();
      pool = null;
    }
  });

  it('allows a patient to fetch nested appointment data for themselves', async () => {
    const response = await request(app)
      .get(`/api/v1/2025/appointments/patients/${patientId}/appointments`)
      .set('Authorization', `Bearer ${PATIENT_TEST_TOKEN}`)
      .expect(200);

    expect(response.body.success).to.equal(true);
    expect(response.body.message).to.equal('Patient appointments retrieved successfully');
    expect(response.body.data).to.be.an('object');
    expect(response.body.data.patient_id).to.equal(patientId);
    expect(response.body.data.appointments).to.be.an('array');

    if (response.body.data.appointments.length > 0) {
      const appointment = response.body.data.appointments[0];
      expect(appointment).to.include.keys(['id', 'appointment_datetime', 'status', 'doctor', 'patient']);
      expect(appointment.doctor).to.include.keys(['id', 'first_name', 'last_name', 'specialization']);
      expect(appointment.patient).to.include.keys(['id', 'first_name', 'last_name']);
    }

    expect(response.body.data.pagination).to.include.keys(['page', 'limit', 'total', 'pages']);
    expect(response.body.data.summary).to.include.keys(['total', 'upcoming', 'past', 'cancelled']);
  });

  it('prevents patients from accessing other patient appointments', async () => {
    const unauthorizedResponse = await request(app)
      .get(`/api/v1/2025/appointments/patients/${patientId + 1}/appointments`)
      .set('Authorization', `Bearer ${PATIENT_TEST_TOKEN}`)
      .expect(403);

    expect(unauthorizedResponse.body.success).to.equal(false);
    expect(unauthorizedResponse.body.message).to.equal('Access denied. You can only view your own appointments.');
  });

  it('allows a doctor to fetch a single appointment with nested data', async () => {
    const response = await request(app)
      .get(`/api/v1/2025/appointments/${appointmentId}`)
      .set('Authorization', `Bearer ${DOCTOR_TEST_TOKEN}`)
      .expect(200);

    expect(response.body.success).to.equal(true);
    expect(response.body.data).to.be.an('object');
    expect(response.body.data.doctor).to.include.keys(['id', 'first_name', 'last_name', 'specialization']);
    expect(response.body.data.patient).to.include.keys(['id', 'first_name', 'last_name']);
  });

  it('creates an appointment with nested doctor and patient data', async () => {
    const payload = {
      doctor_id: 1,
      patient_id: patientId,
      appointment_date: '2025-03-10',
      appointment_time: '09:45',
      location: 'north-wing',
      reason_for_visit: 'Follow-up consultation',
      additional_notes: 'Created during integration tests'
    };

    const response = await request(app)
      .post('/api/v1/2025/appointments')
      .set('Authorization', `Bearer ${DOCTOR_TEST_TOKEN}`)
      .send(payload)
      .expect(201);

    expect(response.body.success).to.equal(true);
    const { appointment } = response.body.data;
    expect(appointment).to.include.keys(['id', 'appointment_datetime', 'doctor', 'patient']);
    expect(appointment.doctor).to.include.keys(['id', 'first_name', 'last_name']);
    expect(appointment.patient).to.include.keys(['id', 'first_name', 'last_name']);
    expect(appointment.patient.id).to.equal(patientId);

    managedAppointmentId = appointment.id;
    createdAppointmentIds.push(appointment.id);
  });

  it('returns nested data after updating an appointment', async () => {
    expect(managedAppointmentId).to.be.a('number');

    const response = await request(app)
      .put(`/api/v1/2025/appointments/${managedAppointmentId}`)
      .set('Authorization', `Bearer ${DOCTOR_TEST_TOKEN}`)
      .send({ location: 'suite-200' })
      .expect(200);

    expect(response.body.success).to.equal(true);
    expect(response.body.data.appointment.location).to.equal('suite-200');
    expect(response.body.data.appointment.doctor).to.include.keys(['id', 'first_name', 'last_name']);
    expect(response.body.data.appointment.patient).to.include.keys(['id', 'first_name', 'last_name']);
  });

  it('returns nested data after rescheduling an appointment', async () => {
    expect(managedAppointmentId).to.be.a('number');

    const response = await request(app)
      .put(`/api/v1/2025/appointments/${managedAppointmentId}/reschedule`)
      .set('Authorization', `Bearer ${DOCTOR_TEST_TOKEN}`)
      .send({ new_date: '2025-02-01', new_time: '11:30', reason: 'Patient requested a later slot' })
      .expect(200);

    expect(response.body.success).to.equal(true);
    const { appointment } = response.body.data;
    expect((appointment.appointment_date || '').split('T')[0]).to.equal('2025-02-01');
    expect(String(appointment.appointment_time)).to.match(/^11:30/);
    expect(appointment.doctor).to.include.keys(['id', 'first_name', 'last_name']);
    expect(appointment.patient).to.include.keys(['id', 'first_name', 'last_name']);
    expect(appointment.additional_notes).to.match(/Reschedule reason:/);
  });

  it('returns nested data after cancelling an appointment', async () => {
    expect(managedAppointmentId).to.be.a('number');

    const response = await request(app)
      .delete(`/api/v1/2025/appointments/${managedAppointmentId}`)
      .set('Authorization', `Bearer ${DOCTOR_TEST_TOKEN}`)
      .send({ reason: 'Patient requested cancellation', notify_patient: false })
      .expect(200);

    expect(response.body.success).to.equal(true);
    expect(response.body.data.appointment.status).to.equal('cancelled');
    expect(response.body.data.appointment.cancellation_reason).to.equal('Patient requested cancellation');
    expect(response.body.data.appointment.doctor).to.include.keys(['id', 'first_name', 'last_name']);
    expect(response.body.data.appointment.patient).to.include.keys(['id', 'first_name', 'last_name']);
  });
});
