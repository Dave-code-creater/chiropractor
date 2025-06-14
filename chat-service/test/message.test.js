const request = require('supertest');
const sinon = require('sinon');
const app = require('../src/index.js');
const jwt = require('jsonwebtoken');
const { strict: assert } = require('assert');

describe('chat endpoints', () => {
  afterEach(() => sinon.restore());

  it('sends message', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: '1', role: 'doctor' });
    sinon.stub(require('../src/models/user.model.js'), 'findById').resolves({ _id: '2' });
    sinon.stub(require('../src/models/conversation.model.js'), 'findOne').resolves(null);
    sinon.stub(require('../src/models/conversation.model.js'), 'create').resolves({ _id: 'c1' });
    const res = await request(app)
      .post('/api/conversations')
      .set('authorization', 'Bearer token')
      .send({ withUserId: '2' });
    assert.equal(res.status, 200);
  });

  it('gets room history', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: '1', role: 'doctor' });
    sinon.stub(require('../src/models/conversation.model.js'), 'findOne').resolves({ _id: 'c1', participants: ['1'] });
    sinon.stub(require('../src/models/message.model.js'), 'find').returns({ sort: () => ({}) });
    const res = await request(app)
      .get('/api/conversations/c1/messages')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });

  it('blocks patient from sending to others', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: '2', role: 'patient' });
    const res = await request(app)
      .post('/api/conversations')
      .set('authorization', 'Bearer token')
      .send({ withUserId: '99' });
    assert.equal(res.status, 403);
  });
});

