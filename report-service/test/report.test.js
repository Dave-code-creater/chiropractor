const request = require('supertest');
const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const { expect } = chai;
const service = require('../src/services/index.service.js');
const broker = require('../src/utils/messageBroker.js');
const app = require('../src/index.js');
const jwt = require('jsonwebtoken');

describe('report-service endpoints', () => {
  beforeEach(() => {
    chai.spy.on(broker, 'publish', () => Promise.resolve());
  });
  afterEach(() => chai.spy.restore());

  it('creates report', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const createSpy = chai.spy.on(service, 'create', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .post('/reports')
      .set('authorization', 'Bearer token')
      .send({ data: {} });
    expect(res.status).to.equal(201);
    expect(createSpy).to.have.been.called();
  });

  it('gets report', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const getSpy = chai.spy.on(service, 'getById', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .get('/reports/1')
      .set('authorization', 'Bearer token');
    expect(res.status).to.equal(200);
    expect(getSpy).to.have.been.called();
  });

  it('updates report', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const updSpy = chai.spy.on(service, 'update', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .put('/reports/1')
      .set('authorization', 'Bearer token')
      .send({ data: {} });
    expect(res.status).to.equal(200);
    expect(updSpy).to.have.been.called();
  });

  it('deletes report', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const delSpy = chai.spy.on(service, 'delete', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .delete('/reports/1')
      .set('authorization', 'Bearer token');
    expect(res.status).to.equal(200);
    expect(delSpy).to.have.been.called();
  });

  it('lists reports', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    const listSpy = chai.spy.on(service, 'list', () => Promise.resolve([]));
    const res = await request(app)
      .get('/reports')
      .set('authorization', 'Bearer token');
    expect(res.status).to.equal(200);
    expect(listSpy).to.have.been.called();
  });
});
