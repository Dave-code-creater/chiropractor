require('dotenv').config();
const request = require('supertest');
const sinon = require('sinon');
const { expect } = require('chai');
const { loadEnv } = require('../src/config/index.js');
const service = require('../src/services/index.service.js');
const repo = require('../src/repositories/profile.repo.js');
const app = require('../src/index.js');
const jwt = require('jsonwebtoken');

before(() => {
  loadEnv();
});

    expect(res.status).to.equal(201);
    expect(res.status).to.equal(200);
    expect(res.status).to.equal(200);
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

describe('user-service profile endpoints', () => {
  afterEach(() => sinon.restore());

  it('creates profile', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(service, 'createProfile').resolves({ profile: { user_id: 1 } });
    const res = await request(app)
      .post('/profiles')
      .set('user-id', '1')
      .set('authorization', 'Bearer token')
      .send({ name: 'john' });
    assert.equal(res.status, 201);
  });

  it('gets profile', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'getProfileById').resolves({ user_id: 1 });
    const res = await request(app)
      .get('/profiles/1')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });

  it('updates profile', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(service, 'updateProfile').resolves({ user_id: 1 });
    const res = await request(app)
      .put('/profiles/1')
      .set('user-id', '1')
      .set('authorization', 'Bearer token')
      .send({ name: 'john' });
    assert.equal(res.status, 200);
  });
});
