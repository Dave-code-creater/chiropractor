const request = require('supertest');
const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const { expect } = chai;
const jwt = require('jsonwebtoken');
const app = require('../src/index.js');
const RecoveryService = require('../src/services/recovery.service.js');
const WorkImpactService = require('../src/services/work_impact.service.js');
const ReportGroupService = require('../src/services/report_group.service.js');
const InsuranceService = require('../src/services/insurance.service.js');
const PainService = require('../src/services/pain.service.js');
const DetailsService = require('../src/services/details_description.service.js');
const HealthConditionService = require('../src/services/health_condition.service.js');
const PreliminaryService = require('../src/services/preliminary.service.js');
const { loadEnv } = require('../src/config/index.js');

before(() => {
  process.env.JWT_SECRET = 'testsecret';
  loadEnv();
});

describe('user-service form submissions', () => {
  afterEach(() => chai.spy.restore());


  it('creates a report group', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const spy = chai.spy.on(ReportGroupService, 'create', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .post('/report-groups')
      .set('authorization', 'Bearer token')
      .send({});
    expect(res.status).to.equal(201);
    expect(spy).to.have.been.called();
  });



  it('creates empty recovery form', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const spy = chai.spy.on(RecoveryService, 'create', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .post('/report-groups/1/recovery')
      .set('authorization', 'Bearer token')
      .send({});
    expect(res.status).to.equal(201);
    expect(spy).to.have.been.called();
  });

  it('creates empty work impact form', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const spy = chai.spy.on(WorkImpactService, 'create', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .post('/report-groups/1/work-impact')
      .set('authorization', 'Bearer token')
      .send({});
    expect(res.status).to.equal(201);
    expect(spy).to.have.been.called();
  });

  it('creates empty insurance detail form', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const spy = chai.spy.on(InsuranceService, 'create', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .post('/insurance-details')
      .set('authorization', 'Bearer token')
      .send({});
    expect(res.status).to.equal(201);
    expect(spy).to.have.been.called();
  });

  it('creates empty pain description form', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const spy = chai.spy.on(PainService, 'create', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .post('/pain-descriptions')
      .set('authorization', 'Bearer token')
      .send({});
    expect(res.status).to.equal(201);
    expect(spy).to.have.been.called();
  });

  it('creates empty details description form', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const spy = chai.spy.on(DetailsService, 'create', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .post('/details-descriptions')
      .set('authorization', 'Bearer token')
      .send({});
    expect(res.status).to.equal(201);
    expect(spy).to.have.been.called();
  });

  it('creates empty health condition form', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const spy = chai.spy.on(HealthConditionService, 'create', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .post('/health-conditions')
      .set('authorization', 'Bearer token')
      .send({});
    expect(res.status).to.equal(201);
    expect(spy).to.have.been.called();
  });

  it('creates preliminary form with required fields', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const spy = chai.spy.on(PreliminaryService, 'create', () => Promise.resolve({ id: 1 }));
    const intake = {
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
      emergency_contact_relationship: 'Sibling',
    };
    const res = await request(app)
      .post('/patient-intake')
      .set('authorization', 'Bearer token')
      .send(intake);
    expect(res.status).to.equal(201);
    expect(spy).to.have.been.called();
  });
});
