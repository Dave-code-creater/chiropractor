// test/insurance.test.js
require('dotenv').config();
const request = require('supertest');
const { expect } = require('chai');
const config = require('../src/config/index.js');
const { loadEnv } = config;
const repo = require('../src/repositories/insurance.repo.js');
const service = require('../src/services/insurance.service.js');
const app = require('../src/index.js');
const jwt = require('jsonwebtoken');

let _origVerify, _origCreate, _origGetById, _origUpdate, _origGetDb;

before(() => {
  process.env.JWT_SECRET = 'testsecret';
  process.env.JWT_EXPIRES_IN = '15m';
  loadEnv();

  // save originals
  _origVerify = jwt.verify;
  _origCreate = service.create;
  _origGetById = service.getByID;
  _origUpdate = service.update;
  _origGetDb = config.getDb;
});

beforeEach(() => {
  // stub DB deletion since no database is available
  config.getDb = () => ({
    deleteFrom: () => ({ execute: () => Promise.resolve() })
  });
});

afterEach(() => {
  // restore originals
  jwt.verify = _origVerify;
  service.create = _origCreate;
  service.getByID = _origGetById;
  service.update = _origUpdate;
  config.getDb = _origGetDb;
});

describe('user-service insurance details', () => {
  it('creates insurance detail', async () => {
    // stub
    jwt.verify = () => ({ sub: 1 });
    service.create = () => Promise.resolve({ id: 1 });

    const res = await request(app)
      .post('/insurance-details')
      .set('authorization', 'Bearer fake-token')
      .send({ insurance_detail: { details: 'x' } });

    expect(res.status).to.equal(201);
  });

  it('gets insurance detail', async () => {
    jwt.verify = () => ({ sub: 1 });
    service.getByID = () => Promise.resolve({ id: 1 });

    const res = await request(app)
      .get('/insurance-details/1')
      .set('authorization', 'Bearer fake-token');

    expect(res.status).to.equal(200);
  });

  it('updates insurance detail', async () => {
    jwt.verify = () => ({ sub: 1, role: 'doctor' });
    service.update = () => Promise.resolve({ id: 1 });

    const res = await request(app)
      .put('/insurance-details/1')
      .set('authorization', 'Bearer fake-token')
      .send({ details: 'x' });

    expect(res.status).to.equal(200);
  });
});