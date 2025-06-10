const request = require('supertest');
const sinon = require('sinon');
const repo = require('../src/repositories/appointment.repo.js');
const app = require('../src/index.js');
const { strict: assert } = require('assert');
const jwt = require('jsonwebtoken');

describe('appointment-service endpoints', () => {
  afterEach(() => sinon.restore());

  it('creates appointment', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'createAppointment').resolves({ id: 1 });
    const res = await request(app)
      .post('/appointments')
      .set('authorization', 'Bearer token')
      .send({ patient_id: 1 });
    assert.equal(res.status, 201);
  });

  it('gets appointment', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'getAppointmentById').resolves({ id: 1 });
    const res = await request(app)
      .get('/appointments/1')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });

  it('updates appointment', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'updateAppointment').resolves({ id: 1 });
    const res = await request(app)
      .put('/appointments/1')
      .set('authorization', 'Bearer token')
      .send({ patient_id: 1 });
    assert.equal(res.status, 200);
  });

  it('lists appointments', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'listAppointments').resolves([]);
    const res = await request(app)
      .get('/appointments')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });
});
