const request = require('supertest');
const app = require('../src/index.js');
const { strict: assert } = require('assert');

describe('gateway health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
  });
});
