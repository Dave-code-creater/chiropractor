import request from 'supertest';
import sinon from 'sinon';
import * as repo from '../src/repositories/index.repo.js';
import app from '../src/index.js';
import { strict as assert } from 'assert';

describe('appointment-service endpoints', () => {
  afterEach(() => sinon.restore());

  it('creates appointment', async () => {
    sinon.stub(repo, 'createAppointment').resolves({ id: 1 });
    const res = await request(app)
      .post('/appointments')
      .send({ patient_id: 1 });
    assert.equal(res.status, 201);
  });

  it('gets appointment', async () => {
    sinon.stub(repo, 'getAppointmentById').resolves({ id: 1 });
    const res = await request(app).get('/appointments/1');
    assert.equal(res.status, 200);
  });

  it('updates appointment', async () => {
    sinon.stub(repo, 'updateAppointment').resolves({ id: 1 });
    const res = await request(app)
      .put('/appointments/1')
      .send({ patient_id: 1 });
    assert.equal(res.status, 200);
  });

  it('lists appointments', async () => {
    sinon.stub(repo, 'listAppointments').resolves([]);
    const res = await request(app).get('/appointments');
    assert.equal(res.status, 200);
  });
});
