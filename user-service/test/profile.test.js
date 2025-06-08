import request from 'supertest';
import sinon from 'sinon';
import * as repo from '../src/repositories/index.repo.js';
import app from '../src/index.js';
import { strict as assert } from 'assert';

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
