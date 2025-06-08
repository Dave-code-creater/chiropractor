import request from 'supertest';
import sinon from 'sinon';
import * as repo from '../src/repositories/index.repo.js';
import app from '../src/index.js';
import { strict as assert } from 'assert';

describe('user-service emergency contacts', () => {
  afterEach(() => sinon.restore());

  it('creates emergency contact', async () => {
    sinon.stub(repo, 'createEmergencyContact').resolves({ id: 1 });
    const res = await request(app)
      .post('/emergency-contacts')
      .send({ name: 'bob' });
    assert.equal(res.status, 201);
  });

  it('gets emergency contact', async () => {
    sinon.stub(repo, 'getEmergencyContactById').resolves({ id: 1 });
    const res = await request(app).get('/emergency-contacts/1');
    assert.equal(res.status, 200);
  });

  it('updates emergency contact', async () => {
    sinon.stub(repo, 'updateEmergencyContact').resolves({ id: 1 });
    const res = await request(app)
      .put('/emergency-contacts/1')
      .send({ name: 'bob' });
    assert.equal(res.status, 200);
  });
});
