const request = require('supertest');
const sinon = require('sinon');
const repo = require('../src/repositories/emergency.repo.js');
const app = require('../src/index.js');
const { strict: assert } = require('assert');

describe('user-service emergency contacts', () => {
  afterEach(() => sinon.restore());

  it('creates emergency contact', async () => {
    sinon.stub(repo, 'createEmergencyContact').resolves({ id: 1 });
    const res = await request(app)
      .post('/emergency-contacts')
      .set('user-id', '1')
      .send({ emergency_contact: { name: 'bob' } });
    assert.equal(res.status, 201);
  });

  it('gets emergency contact', async () => {
    sinon.stub(repo, 'getEmergencyContactById').resolves({ id: 1 });
    const res = await request(app).get('/emergency-contacts/1');
    assert.equal(res.status, 200);
  });

  it('updates emergency contact', async () => {
    sinon.stub(repo, 'updateEmergencyContact').resolves({ id: 1 });
    const res = await request(app)
      .put('/emergency-contacts/1')
      .send({ name: 'bob' });
    assert.equal(res.status, 200);
  });
});
