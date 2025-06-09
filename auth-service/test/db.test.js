const repo = require('../src/repositories/user.repo.js');
const request = require('supertest');
const sinon = require('sinon');
const app = require('../src/index.js');
const { strict: assert } = require('assert');

it('registers user', async () => {
    sinon.stub(repo, 'findUserByEmail').resolves(null);
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
