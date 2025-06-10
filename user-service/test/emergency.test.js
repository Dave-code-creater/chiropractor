const request = require('supertest');
const sinon = require('sinon');
const repo = require('../src/repositories/emergency.repo.js');
const service = require('../src/services/index.service.js');
const app = require('../src/index.js');
const jwt = require('jsonwebtoken');
const { strict: assert } = require('assert');

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
