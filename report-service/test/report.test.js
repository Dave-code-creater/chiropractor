const request = require('supertest');
const sinon = require('sinon');
const repo = require('../src/repositories/report.repo.js');
let app;
const { strict: assert } = require('assert');
const jwt = require('jsonwebtoken');

describe('report-service endpoints', () => {
  afterEach(() => {
    sinon.restore();
    delete require.cache[require.resolve('../src/index.js')];
    delete require.cache[require.resolve('../src/controllers/report.controller.js')];
  });

  it('creates report', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'createReport').resolves({ id: 1 });
    delete require.cache[require.resolve('../src/index.js')];
    app = require('../src/index.js');
    const res = await request(app)
      .post('/reports')
      .set('authorization', 'Bearer token')
      .send({ data: {} });
    assert.equal(res.status, 201);
  });

  it('gets report', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'getReportById').resolves({ id: 1 });
    delete require.cache[require.resolve('../src/index.js')];
    app = require('../src/index.js');
    const res = await request(app)
      .get('/reports/1')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });

  it('updates report', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'updateReport').resolves({ id: 1 });
    delete require.cache[require.resolve('../src/index.js')];
    app = require('../src/index.js');
    const res = await request(app)
      .put('/reports/1')
      .set('authorization', 'Bearer token')
      .send({ data: {} });
    assert.equal(res.status, 200);
  });

  it('lists reports', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'listReports').resolves([]);
    delete require.cache[require.resolve('../src/index.js')];
    app = require('../src/index.js');
    const res = await request(app)
      .get('/reports')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });
});
