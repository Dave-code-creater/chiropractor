import request from 'supertest';
import sinon from 'sinon';
import * as repo from '../src/repositories/index.repo.js';
import app from '../src/index.js';
import { strict as assert } from 'assert';

describe('report-service endpoints', () => {
  afterEach(() => sinon.restore());

  it('creates report', async () => {
    sinon.stub(repo, 'createReport').resolves({ id: 1 });
    const res = await request(app)
      .post('/reports')
      .send({ data: {} });
    assert.equal(res.status, 201);
  });

  it('gets report', async () => {
    sinon.stub(repo, 'getReportById').resolves({ id: 1 });
    const res = await request(app).get('/reports/1');
    assert.equal(res.status, 200);
  });

  it('updates report', async () => {
    sinon.stub(repo, 'updateReport').resolves({ id: 1 });
    const res = await request(app)
      .put('/reports/1')
      .send({ data: {} });
    assert.equal(res.status, 200);
  });

  it('lists reports', async () => {
    sinon.stub(repo, 'listReports').resolves([]);
    const res = await request(app).get('/reports');
    assert.equal(res.status, 200);
  });
});
