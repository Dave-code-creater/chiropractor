require('dotenv').config();
const request = require('supertest');
const { expect } = require('chai');
const { loadEnv } = require('../src/config/index.js');
const app = require('../src/index.js');

before(() => {
  loadEnv();
});

describe('user-service health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/');
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ status: 'ok' });
  });
});
