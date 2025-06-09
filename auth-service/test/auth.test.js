require('dotenv').config();
const request = require('supertest');
const app = require('../src/index.js');
const { expect } = require('chai');
const { loadEnv, getDb } = require('../src/config/index');
const jwt = require('jsonwebtoken');

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

describe('AuthService integration tests', () => {
  it('registers a new user', async () => {
    const res = await request(app).post('/register').send({
      email: 'test@example.com',
      password: 'password123',
      first_name: 'Test',
      last_name: 'User',
      role: 'patient',
    });

    expect(res.status).to.equal(201);
    expect(res.body).to.have.nested.property('metadata.token');
    expect(res.body).to.have.nested.property('metadata.refreshToken');
  });

  it('fails registration if email exists', async () => {
    await request(app).post('/register').send({
      email: 'existing@example.com',
      password: 'password123',
      first_name: 'Existing',
      last_name: 'User',
      role: 'patient'
    });

    const res = await request(app).post('/register').send({
      email: 'existing@example.com',
      password: 'password123',
      first_name: 'Existing',
      last_name: 'User',
      role: 'patient'
    });

    expect(res.status).to.equal(409);
    expect(res.body.message).to.equal('email taken');
  });

  it('logs in successfully with correct credentials', async () => {
    await request(app).post('/register').send({
      email: 'login@example.com',
      password: 'secret',
      first_name: 'Login',
      last_name: 'User',
      role: 'patient'
    });

    const res = await request(app).post('/login').send({
      email: 'login@example.com',
      password: 'secret',
    });

    expect(res.status).to.equal(200);
    expect(res.body).to.have.nested.property('metadata.token');
  });

  it('fails login with wrong password', async () => {
    await request(app).post('/register').send({
      email: 'wrongpass@example.com',
      password: 'correctpass',
      first_name: 'Wrong',
      last_name: 'Password',
      role: 'patient'
    });

    const res = await request(app).post('/login').send({
      email: 'wrongpass@example.com',
      password: 'badpass',
    });

    expect(res.status).to.equal(401);
    expect(res.body.message).to.equal('invalid credentials');
  });
});

it('returns a valid JWT after login', async () => {
  await request(app).post('/register').send({
    email: 'jwtcheck@example.com',
    password: 'validtoken',
    first_name: 'JWT',
    last_name: 'Check',
    role: 'patient'
  });

  const res = await request(app).post('/login').send({
    email: 'jwtcheck@example.com',
    password: 'validtoken',
  });

  expect(res.status).to.equal(200);
  const token = res.body.metadata.token;
  expect(token).to.be.a('string');

  // Verify the JWT
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  expect(decoded).to.have.property('sub');
  expect(decoded).to.have.property('email', 'jwtcheck@example.com');
});

it('refreshes the JWT with valid refresh token', async () => {
  const reg = await request(app).post('/register').send({
    email: 'refresh@example.com',
    password: 'refresh123',
    first_name: 'Re',
    last_name: 'Fresh',
    role: 'patient'
  });

  const refreshToken = reg.body.metadata.refreshToken;

  const res = await request(app)
    .post('/refresh')
    .set('Authorization', `Bearer ${refreshToken}`);

  expect(res.status).to.equal(200);
  expect(res.body.metadata).to.have.property('token');
  expect(res.body.metadata.token).to.be.a('string');
});

it('logs out and invalidates refresh token', async () => {
  const reg = await request(app).post('/register').send({
    email: 'logout@example.com',
    password: 'logout123',
    first_name: 'Log',
    last_name: 'Out',
    role: 'patient'
  });

  const token = reg.body.metadata.token;

  const logoutRes = await request(app)
    .post('/logout')
    .set('Authorization', `Bearer ${token}`);

  expect(logoutRes.status).to.equal(204);

  const res = await request(app)
    .post('/refresh')
    .set('Authorization', `Bearer ${token}`);

  expect(res.status).to.equal(401);
  expect(res.body.message).to.match(/invalid refresh token/i);
});