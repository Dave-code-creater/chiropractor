const request = require('supertest');
const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const AppointmentService = require('../src/services/index.service.js');
const app = require('../src/index.js');
const { expect } = chai;
const jwt = require('jsonwebtoken');

describe('appointment-service endpoints', () => {
  afterEach(() => chai.spy.restore());

  it('creates appointment', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1, role: 'doctor' }));
    const createSpy = chai.spy.on(AppointmentService, 'createAppointment', () =>
      Promise.resolve({ id: 1 })
    );
    const res = await request(app)
      .post('/appointments')
      .set('authorization', 'Bearer token')
      .send({ patient_id: 1 });
    expect(res.status).to.equal(201);
    expect(createSpy).to.have.been.called();
  });

  it('gets appointment', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1, role: 'doctor' }));
    const getSpy = chai.spy.on(AppointmentService, 'getAppointment', () =>
      Promise.resolve({ id: 1 })
    );
    const res = await request(app)
      .get('/appointments/1')
      .set('authorization', 'Bearer token');
    expect(res.status).to.equal(200);
    expect(getSpy).to.have.been.called();
  });

  it('updates appointment', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1, role: 'doctor' }));
    const updateSpy = chai.spy.on(AppointmentService, 'updateAppointment', () =>
      Promise.resolve({ id: 1 })
    );
    const res = await request(app)
      .put('/appointments/1')
      .set('authorization', 'Bearer token')
      .send({ patient_id: 1 });
    expect(res.status).to.equal(200);
    expect(updateSpy).to.have.been.called();
  });

  it('lists appointments for doctor', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1, role: 'doctor' }));
    const listSpy = chai.spy.on(
      AppointmentService,
      'listAppointmentsByDoctor',
      () => Promise.resolve([])
    );
    const res = await request(app)
      .get('/appointments')
      .set('authorization', 'Bearer token');
    expect(res.status).to.equal(200);
    expect(listSpy).to.have.been.called();
  });

  it('lists appointments for patient', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 7, role: 'user' }));
    const listSpy = chai.spy.on(
      AppointmentService,
      'listAppointmentsByPatient',
      () => Promise.resolve([])
    );
    const res = await request(app)
      .get('/appointments')
      .set('authorization', 'Bearer token');
    expect(res.status).to.equal(200);
    expect(listSpy).to.have.been.called.with(7);
  });
});
