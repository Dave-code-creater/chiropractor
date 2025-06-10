const request = require('supertest');
const sinon = require('sinon');
const repo = require('../src/repositories/insurance.repo.js');
const service = require('../src/services/index.service.js');
const app = require('../src/index.js');
const jwt = require('jsonwebtoken');
const { strict: assert } = require('assert');

describe('user-service insurance details', () => {
  afterEach(() => sinon.restore());

  it('creates insurance detail', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'createInsuranceDetail').resolves({ id: 1 });
    const res = await request(app)
      .post('/insurance-details')
      .set('user-id', '1')
      .set('authorization', 'Bearer token')
      .send({ insurance_detail: { details: 'x' } });
    assert.equal(res.status, 201);
  });

  it('gets insurance detail', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'getInsuranceDetailById').resolves({ id: 1 });
    const res = await request(app)
      .get('/insurance-details/1')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });

  it('updates insurance detail', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(service, 'updateInsuranceDetail').resolves({ id: 1 });
    const res = await request(app)
      .put('/insurance-details/1')
      .set('authorization', 'Bearer token')
      .send({ details: 'x' });
    assert.equal(res.status, 200);
  });
});
