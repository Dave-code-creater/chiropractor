const request = require('supertest');
const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const app = require('../src/index.js');
const service = require('../src/services/index.service.js');
const broker = require('../src/utils/messageBroker.js');
const { expect } = chai;

describe('auth user CRUD', () => {
  beforeEach(() => {
    chai.spy.on(broker, 'publish', () => Promise.resolve());
  });
  afterEach(() => chai.spy.restore());

  it('updates user', async () => {
    chai.spy.on(service, 'updateUser', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .put('/users/1')
      .send({ first_name: 'x' });
    expect(res.status).to.equal(200);
  });

  it('deletes user', async () => {
    chai.spy.on(service, 'deleteUser', () => Promise.resolve({ id: 1 }));
    const res = await request(app)
      .delete('/users/1');
    expect(res.status).to.equal(200);
  });

  it('lists users', async () => {
    chai.spy.on(service, 'listUsers', () => Promise.resolve([{ id: 1 }]));
    const res = await request(app).get('/users');
    expect(res.status).to.equal(200);
    expect(service.listUsers).to.have.been.called();
  });
});
