require('dotenv').config();
const request = require('supertest');
const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const { expect } = chai;
const { loadEnv } = require('../src/config/index.js');
const app = require('../src/index.js');

before(() => {
  loadEnv();
});

describe('user-service health', () => {
  it('returns ok', async () => {
    const spy = chai.spy.on(console, 'log');
    const res = await request(app).get('/');
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ status: 'ok' });
    chai.spy.restore(spy);
  });
});
