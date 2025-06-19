const request = require('supertest');
const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const app = require('../src/index.js');
const repo = require('../src/repositories/user.repo.js');
const AuthService = require('../src/services/index.service.js');
const broker = require('../src/utils/messageBroker.js');
const { expect } = chai;

describe('forgot password flow', () => {
  beforeEach(() => {
    chai.spy.on(broker, 'publish', () => Promise.resolve());
  });
  afterEach(() => chai.spy.restore());

  it('resets password when email and phone match', async () => {
    chai.spy.on(repo, 'findUserByEmailAndPhone', () => Promise.resolve({ id: 1 }));
    const updateSpy = chai.spy.on(repo, 'updateUserPassword', () => Promise.resolve({ id: 1 }));

    const res = await request(app)
      .post('/forgot-password')
      .send({ email: 'User@example.com', phone_number: '+123', new_password: 'newpass' });

    expect(res.status).to.equal(200);
    expect(updateSpy).to.have.been.called();
  });
});
