import request from 'supertest';
import sinon from 'sinon';
import * as repo from '../src/repositories/index.repo.js';
import app from '../src/index.js';
import { strict as assert } from 'assert';

describe('user-service insurance details', () => {
  afterEach(() => sinon.restore());

  it('creates insurance detail', async () => {
    sinon.stub(repo, 'createInsuranceDetail').resolves({ id: 1 });
    const res = await request(app)
      .post('/insurance-details')
      .send({ details: 'x' });
    assert.equal(res.status, 201);
  });

  it('gets insurance detail', async () => {
    sinon.stub(repo, 'getInsuranceDetailById').resolves({ id: 1 });
    const res = await request(app).get('/insurance-details/1');
    assert.equal(res.status, 200);
  });

  it('updates insurance detail', async () => {
    sinon.stub(repo, 'updateInsuranceDetail').resolves({ id: 1 });
    const res = await request(app)
      .put('/insurance-details/1')
      .send({ details: 'x' });
    assert.equal(res.status, 200);
  });
});
