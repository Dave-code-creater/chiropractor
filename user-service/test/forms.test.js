const request = require('supertest');
const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const { expect } = chai;
const jwt = require('jsonwebtoken');
const app = require('../src/index.js');
const profileRepo = require('../src/repositories/profile.repo.js');
const emergencyRepo = require('../src/repositories/emergency.repo.js');
const insuranceRepo = require('../src/repositories/insurance.repo.js');
const painRepo = require('../src/repositories/pain.repo.js');
const detailsRepo = require('../src/repositories/details_description.repo.js');
const healthRepo = require('../src/repositories/health_condition.repo.js');
const prelimRepo = require('../src/repositories/preliminary.repo.js');
const { loadEnv } = require('../src/config/index.js');

before(() => {
  process.env.JWT_SECRET = 'testsecret';
  loadEnv();
});

describe('user-service form submissions', () => {
  afterEach(() => chai.spy.restore());

  it('creates patient intake profile with required fields', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const profileSpy = chai.spy.on(profileRepo, 'createProfile', () => Promise.resolve({ id: 1 }));
    chai.spy.on(emergencyRepo, 'createEmergencyContact', () => Promise.resolve({ id: 1 }));
    chai.spy.on(insuranceRepo, 'createInsuranceDetail', () => Promise.resolve({ id: 1 }));
    chai.spy.on(painRepo, 'createPainDescription', () => Promise.resolve({ id: 1 }));

    const res = await request(app)
      .post('/profiles')
      .set('authorization', 'Bearer token')
      .send({
        first_name: 'Alice',
        last_name: 'Smith',
        middle_name: 'Marie',
        day_of_birth: '15',
        month_of_birth: 'June',
        year_of_birth: '1990',
        gender: 'Female',
        street_address: '123 Maple Street',
        city: 'Springfield',
        state: 'IL',
        zip_code: '62704',
        country: 'United States',
        emergency_contact_name: 'Bob Smith',
        emergency_contact_phone: '+13175551234',
        emergency_contact_relationship: 'Sibling'
      });

    expect(res.status).to.equal(201);
    expect(profileSpy).to.have.been.called();
  });

  it('creates empty emergency contact form', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const spy = chai.spy.on(emergencyRepo, 'createEmergencyContact', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .post('/emergency-contacts')
      .set('authorization', 'Bearer token')
      .send({});
    expect(res.status).to.equal(201);
    expect(spy).to.have.been.called();
  });

  it('creates empty insurance detail form', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const spy = chai.spy.on(insuranceRepo, 'createInsuranceDetail', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .post('/insurance-details')
      .set('authorization', 'Bearer token')
      .send({});
    expect(res.status).to.equal(201);
    expect(spy).to.have.been.called();
  });

  it('creates empty pain description form', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const spy = chai.spy.on(painRepo, 'createPainDescription', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .post('/pain-descriptions')
      .set('authorization', 'Bearer token')
      .send({});
    expect(res.status).to.equal(201);
    expect(spy).to.have.been.called();
  });

  it('creates empty details description form', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const spy = chai.spy.on(detailsRepo, 'createDetailsDescription', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .post('/details-descriptions')
      .set('authorization', 'Bearer token')
      .send({});
    expect(res.status).to.equal(201);
    expect(spy).to.have.been.called();
  });

  it('creates empty health condition form', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const spy = chai.spy.on(healthRepo, 'createHealthCondition', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .post('/health-conditions')
      .set('authorization', 'Bearer token')
      .send({});
    expect(res.status).to.equal(201);
    expect(spy).to.have.been.called();
  });

  it('creates empty preliminary form', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const spy = chai.spy.on(prelimRepo, 'createPreliminary', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .post('/preliminaries')
      .set('authorization', 'Bearer token')
      .send({});
    expect(res.status).to.equal(201);
    expect(spy).to.have.been.called();
  });
});
