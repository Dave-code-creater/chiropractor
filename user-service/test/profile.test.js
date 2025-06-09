const request = require('supertest');
const sinon = require('sinon');
const repo = require('../src/repositories/profile.repo.js');
const app = require('../src/index.js');
const { strict: assert } = require('assert');

describe('user-service profile endpoints', () => {
  afterEach(() => sinon.restore());

  it('creates profile', async () => {
    sinon.stub(repo, 'createProfile').resolves({ id: 1 });
    const res = await request(app)
      .post('/profiles')
      .send({ name: 'john' });
    assert.equal(res.status, 201);
  });

  it('gets profile', async () => {
    sinon.stub(repo, 'getProfileById').resolves({ id: 1 });
    const res = await request(app).get('/profiles/1');
    assert.equal(res.status, 200);
  });

  it('updates profile', async () => {
    sinon.stub(repo, 'updateProfile').resolves({ id: 1 });
    const res = await request(app)
      .put('/profiles/1')
      .send({ name: 'john' });
    assert.equal(res.status, 200);
  });
});
