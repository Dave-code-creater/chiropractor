const request = require('supertest');
const app = require('../src/index.js');
const { strict: assert } = require('assert');

describe('report sections endpoint', () => {
  it('lists sections', async () => {
    const res = await request(app).get('/report-sections');
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.metadata));
  });
});
