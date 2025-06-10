const request = require('supertest');
const sinon = require('sinon');
const repo = require('../src/repositories/insurance.repo.js');
const service = require('../src/services/index.service.js');
const app = require('../src/index.js');
const jwt = require('jsonwebtoken');
const { strict: assert } = require('assert');

before(() => {
  process.env.JWT_SECRET = 'testsecret';
  process.env.JWT_EXPIRES_IN = '15m';
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
