const request = require('supertest');
const chai = require('chai');
const app = require('../src/index.js');
const { expect } = chai;

describe('report-service health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/');
    expect(res.status).to.equal(200);
    expect(res.body).to.deep.equal({ status: 'ok' });
  });
});
