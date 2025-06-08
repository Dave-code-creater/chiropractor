import request from 'supertest';
import sinon from 'sinon';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import * as repo from '../src/repositories/index.repo.js';
import app from '../src/index.js';
import { strict as assert } from 'assert';

describe('auth-service endpoints', () => {
  afterEach(() => sinon.restore());

  it('registers user', async () => {
    sinon.stub(repo, 'findUserByEmail').resolves(null);
    sinon.stub(bcrypt, 'hash').resolves('hashed');
    sinon.stub(repo, 'createUser').resolves({ id: 1, username: 'alicesmith' });
    const res = await request(app)
      .post('/register')
      .send({
        email: 'a@example.com',
        password: 'secret',
        first_name: 'Alice',
        last_name: 'Smith',
        role: 'patient'
      });
    assert.equal(res.status, 201);
  });

  it('logs in user', async () => {
    process.env.JWT_SECRET = 'testsecret';
    sinon.stub(repo, 'findUserByUsername').resolves({ id: 1, username: 'alice', password_hash: 'hash' });
    sinon.stub(bcrypt, 'compare').resolves(true);
    sinon.stub(jwt, 'sign').returns('token');
    const res = await request(app)
      .post('/login')
      .send({ username: 'alice', password: 'secret' });
    assert.equal(res.status, 200);
    assert.equal(res.body.metadata.token, 'token');
  });
});
