require('dotenv').config();
const request = require('supertest');
const app = require('../src/index.js');
const { expect } = require('chai');
const { loadEnv, getDb } = require('../src/config/index');

before(() => {
  process.env.JWT_SECRET = 'testsecret';
  process.env.JWT_EXPIRES_IN = '15m';
  loadEnv();
});

beforeEach(async () => {
  const db = getDb();
  await db.deleteFrom('api_keys').execute();
  await db.deleteFrom('users').execute();
});

describe('verify token', () => {
  it('returns payload for valid token', async () => {
    const reg = await request(app).post('/register').send({
      email: 'verify@example.com',
      password: 'secret',
      first_name: 'Verify',
      last_name: 'Token',
      role: 'patient'
    });

    const token = reg.body.metadata.token;

    const res = await request(app)
      .post('/verify')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).to.equal(200);
    expect(res.body.metadata).to.have.property('sub');
    expect(res.body.metadata).to.have.property('email', 'verify@example.com');
  });

  it('fails with invalid token', async () => {
    const res = await request(app)
      .post('/verify')
      .set('Authorization', 'Bearer invalid');

    expect(res.status).to.equal(401);
  });
});
