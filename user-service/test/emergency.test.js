const request = require('supertest');
const sinon = require('sinon');
const repo = require('../src/repositories/emergency.repo.js');
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

describe('user-service emergency contacts', () => {
  afterEach(() => sinon.restore());

  it('creates emergency contact', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'createEmergencyContact').resolves({ id: 1 });
    const res = await request(app)
      .post('/emergency-contacts')
      .set('user-id', '1')
      .set('authorization', 'Bearer token')
      .send({ emergency_contact: { name: 'bob' } });
    assert.equal(res.status, 201);
  });

  it('gets emergency contact', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'getEmergencyContactById').resolves({ id: 1 });
    const res = await request(app)
      .get('/emergency-contacts/1')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });

  it('updates emergency contact', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(service, 'updateEmergencyContact').resolves({ id: 1 });
    const res = await request(app)
      .put('/emergency-contacts/1')
      .set('authorization', 'Bearer token')
      .send({ name: 'bob' });
    assert.equal(res.status, 200);
  });
});
