// test/insurance.test.js
require('dotenv').config();
const request = require('supertest');
const { expect } = require('chai');
const { loadEnv, getDb } = require('../src/config/index');
const repo = require('../src/repositories/insurance.repo.js');
const service = require('../src/services/insurance.service.js');
const app = require('../src/index.js');
const jwt = require('jsonwebtoken');

let _origVerify, _origCreate, _origGetById, _origUpdate;

before(() => {
  process.env.JWT_SECRET = 'testsecret';
  process.env.JWT_EXPIRES_IN = '15m';
  loadEnv();

  // save originals
  _origVerify = jwt.verify;
  _origCreate = repo.createInsuranceDetail;
  _origGetById = repo.getInsuranceDetailById;
  _origUpdate = service.updateInsuranceDetail;
});

beforeEach(async () => {
  // wipe all tables
  const db = getDb();
  await Promise.all([
    'treatment_goals', 'pain_descriptions', 'home_exercises', 'history_accident',
    'pain_chart', 'complaint_locations', 'chief_complaint', 'insurance_details',
    'preliminary_info', 'emergency_contacts', 'profiles'
  ].map(tbl => db.deleteFrom(tbl).execute()));
});

afterEach(() => {
  // restore originals
  jwt.verify = _origVerify;
  repo.createInsuranceDetail = _origCreate;
  repo.getInsuranceDetailById = _origGetById;
  service.updateInsuranceDetail = _origUpdate;
});

describe('user-service insurance details', () => {
  it('creates insurance detail', async () => {
    // stub
    jwt.verify = () => ({ sub: 1 });
    repo.createInsuranceDetail = () => Promise.resolve({ id: 1 });

    const res = await request(app)
      .post('/insurance-details')
      .set('authorization', 'Bearer fake-token')
      .send({ insurance_detail: { details: 'x' } });

    expect(res.status).to.equal(201);
  });

  it('gets insurance detail', async () => {
    jwt.verify = () => ({ sub: 1 });
    repo.getInsuranceDetailById = () => Promise.resolve({ id: 1 });

    const res = await request(app)
      .get('/insurance-details/1')
      .set('authorization', 'Bearer fake-token');

    expect(res.status).to.equal(200);
  });

  it('updates insurance detail', async () => {
    jwt.verify = () => ({ sub: 1, role: 'doctor' });
    service.updateInsuranceDetail = () => Promise.resolve({ id: 1 });

    const res = await request(app)
      .put('/insurance-details/1')
      .set('authorization', 'Bearer fake-token')
      .send({ details: 'x' });

    expect(res.status).to.equal(200);
  });
});