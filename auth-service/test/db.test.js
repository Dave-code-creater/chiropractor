import * as repo from '../src/repositories/index.repo.js';
import request from 'supertest';
import sinon from 'sinon';
import app from '../src/index.js';
import { strict as assert } from 'assert';

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