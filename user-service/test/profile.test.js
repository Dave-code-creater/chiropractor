const request = require('supertest');
const sinon = require('sinon');
const service = require('../src/services/index.service.js');
const repo = require('../src/repositories/profile.repo.js');
const app = require('../src/index.js');
const jwt = require('jsonwebtoken');
const { strict: assert } = require('assert');

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
