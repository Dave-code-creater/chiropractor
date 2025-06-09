const { loadEnv, getDb } = require('../src/config/index');
const request = require('supertest');
const app = require('../src/index.js');
const { strict: assert } = require('assert');

before(() => {
    loadEnv(); 
});

beforeEach(async () => {
    await getDb().deleteFrom('users').execute(); 
});

it('registers user', async () => {
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