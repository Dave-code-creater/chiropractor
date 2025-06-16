const request = require('supertest');
const app = require('../src/index.js');
const { expect } = require('chai');

describe('appointment-service health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/');
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ status: 'ok' });
  });
});
