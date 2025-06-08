import request from 'supertest';
import app from '../src/index.js';
import { strict as assert } from 'assert';

describe('chat-service health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body, { status: 'ok' });
  });
});
