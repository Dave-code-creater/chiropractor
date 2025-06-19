const request = require('supertest');
const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const { expect } = chai;
const repo = require('../src/repositories/report.repo.js');
let app;
const jwt = require('jsonwebtoken');

describe('report-service endpoints', () => {
  afterEach(() => chai.spy.restore());

  it('creates report', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const createSpy = chai.spy.on(repo, 'createReport', () => Promise.resolve({ id: 1 }));
    delete require.cache[require.resolve('../src/index.js')];
    app = require('../src/index.js');
    const res = await request(app)
      .post('/reports')
      .set('authorization', 'Bearer token')
      .send({ data: {} });
    expect(res.status).to.equal(201);
    expect(createSpy).to.have.been.called();
  });

  it('gets report', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const getSpy = chai.spy.on(repo, 'getReportById', () => Promise.resolve({ id: 1 }));
    delete require.cache[require.resolve('../src/index.js')];
    app = require('../src/index.js');
    const res = await request(app)
      .get('/reports/1')
      .set('authorization', 'Bearer token');
    expect(res.status).to.equal(200);
    expect(getSpy).to.have.been.called();
  });

  it('updates report', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const updateSpy = chai.spy.on(repo, 'updateReport', () => Promise.resolve({ id: 1 }));
    delete require.cache[require.resolve('../src/index.js')];
    app = require('../src/index.js');
    const res = await request(app)
      .put('/reports/1')
      .set('authorization', 'Bearer token')
      .send({ data: {} });
    expect(res.status).to.equal(200);
    expect(updateSpy).to.have.been.called();
  });

  it('lists reports', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const listSpy = chai.spy.on(repo, 'listReports', () => Promise.resolve([]));
    delete require.cache[require.resolve('../src/index.js')];
    app = require('../src/index.js');
    const res = await request(app)
      .get('/reports')
      .set('authorization', 'Bearer token');
    expect(res.status).to.equal(200);
    expect(listSpy).to.have.been.called();
  });

  it('lists reports by owner', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const spy = chai.spy.on(repo, 'listReportsByOwner', () => Promise.resolve([]));
    delete require.cache[require.resolve('../src/index.js')];
    app = require('../src/index.js');
    const res = await request(app)
      .get('/reports/owner/1')
      .set('authorization', 'Bearer token');
    expect(res.status).to.equal(200);
    expect(spy).to.have.been.called.with(1);
  });
});
