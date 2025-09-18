process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-here-minimum-32-chars';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;

const { expect } = require('chai');
const request = require('supertest');
const { app } = require('../../src/index');
const { connectPostgreSQL, getPostgreSQLPool, closePostgreSQLPool } = require('../../src/config/database');
const { repositoryFactory } = require('../../src/repositories');

describe('Auth API nested responses', () => {
  let pool;
  let cachedRefreshToken;

  before(async () => {
    await connectPostgreSQL();
    repositoryFactory.clearInstances();
    pool = getPostgreSQLPool();
  });

  after(async () => {
    if (pool) {
      await closePostgreSQLPool();
      pool = null;
    }
    repositoryFactory.clearInstances();
  });

  it('returns nested data structure on login', async () => {
    const response = await request(app)
      .post('/api/v1/2025/auth/login')
      .send({
        email: 'jane.doe@example.com',
        password: 'patient123',
        remember_me: false
      })
      .expect(200);

    expect(response.body.success).to.equal(true);
    expect(response.body).to.have.property('data');

    const { data } = response.body;
    expect(data).to.be.an('object');
    expect(data).to.have.property('user').that.is.an('object');
    expect(data.user).to.include.keys(['id', 'email', 'role', 'profile']);
    expect(data.user.profile).to.include.keys(['id', 'first_name', 'last_name', 'type']);

    expect(data).to.have.property('profile').that.deep.equals(data.user.profile);
    expect(data).to.have.property('patient').that.deep.equals(data.user.profile);

    expect(data).to.have.property('tokens').that.is.an('object');
    expect(data.tokens).to.include.keys(['accessToken', 'refreshToken']);
    expect(data.tokens.accessToken).to.be.a('string');
    expect(data.tokens.refreshToken).to.be.a('string');

    cachedRefreshToken = data.tokens.refreshToken;
  });

  it('returns nested data when refreshing a token', async () => {
    expect(cachedRefreshToken).to.be.a('string');

    await new Promise((resolve) => setTimeout(resolve, 1100));

    const response = await request(app)
      .post('/api/v1/2025/auth/refresh-token')
      .send({ refresh_token: cachedRefreshToken })
      .expect(200);

    expect(response.body.success).to.equal(true);
    expect(response.body).to.have.property('data');

    const { data } = response.body;
    expect(data).to.be.an('object');
    expect(data).to.have.property('user').that.is.an('object');
    expect(data.user).to.include.keys(['id', 'email', 'role', 'profile']);
    expect(data).to.have.property('profile').that.deep.equals(data.user.profile);
    expect(data).to.have.property('patient').that.deep.equals(data.user.profile);

    expect(data).to.have.property('tokens').that.is.an('object');
    expect(data.tokens).to.include.keys(['accessToken', 'refreshToken']);
    expect(data.tokens.accessToken).to.be.a('string');
    expect(data.tokens.refreshToken).to.be.a('string');
  });
});
