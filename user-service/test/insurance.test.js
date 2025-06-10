require('dotenv').config();
const request = require('supertest');
const sinon = require('sinon');
const { expect } = require('chai');
const { loadEnv } = require('../src/config/index.js');
const repo = require('../src/repositories/insurance.repo.js');
const InsuranceService = require('../src/services/insurance.service.js');
const app = require('../src/index.js');
const jwt = require('jsonwebtoken');

before(() => {
  loadEnv();
});

    expect(res.status).to.equal(201);
    expect(res.status).to.equal(200);
    sinon.stub(InsuranceService, 'update').resolves({ id: 1 });
  loadEnv();
});

beforeEach(async () => {
  const db = getDb();
  await db.deleteFrom('treatment_goals').execute();
  await db.deleteFrom('pain_descriptions').execute();
  await db.deleteFrom('home_exercises').execute();
  await db.deleteFrom('history_accident').execute();
  await db.deleteFrom('pain_chart').execute();
  await db.deleteFrom('complaint_locations').execute();
  await db.deleteFrom('chief_complaint').execute();
  await db.deleteFrom('insurance_details').execute();
  await db.deleteFrom('preliminary_info').execute();
  await db.deleteFrom('emergency_contacts').execute();
  await db.deleteFrom('profiles').execute();
})

describe('user-service insurance details', () => {
  afterEach(() => sinon.restore());

  it('creates insurance detail', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'createInsuranceDetail').resolves({ id: 1 });
    const res = await request(app)
      .post('/insurance-details')
      .set('user-id', '1')
      .set('authorization', 'Bearer token')
      .send({ insurance_detail: { details: 'x' } });
    assert.equal(res.status, 201);
  });

  it('gets insurance detail', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'getInsuranceDetailById').resolves({ id: 1 });
    const res = await request(app)
      .get('/insurance-details/1')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });

  it('updates insurance detail', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(service, 'updateInsuranceDetail').resolves({ id: 1 });
    const res = await request(app)
      .put('/insurance-details/1')
      .set('authorization', 'Bearer token')
      .send({ details: 'x' });
    assert.equal(res.status, 200);
  });
});
