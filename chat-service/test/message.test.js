const request = require('supertest');
const sinon = require('sinon');
const app = require('../src/index.js');
const ChatService = require('../src/services/index.service.js');
const jwt = require('jsonwebtoken');
const { strict: assert } = require('assert');

describe('message endpoints', () => {
  afterEach(() => sinon.restore());

  it('sends message', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(ChatService, 'send').resolves({ id: 1 });
    const res = await request(app)
      .post('/messages')
      .set('authorization', 'Bearer token')
      .send({ room: 'r1', sender: 1, receiver: 2, text: 'hi' });
    assert.equal(res.status, 201);
  });

  it('gets room history', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(ChatService, 'historyByRoom').resolves([]);
    const res = await request(app)
      .get('/chat/history/r1')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });

  it('gets user history', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(ChatService, 'historyByUser').resolves([]);
    const res = await request(app)
      .get('/messages/user/1')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });

  it('forbids sending to random user when not doctor', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1, role: 'patient' });
    const res = await request(app)
      .post('/messages')
      .set('authorization', 'Bearer token')
      .send({ room: 'r1', sender: 1, receiver: 99, text: 'hi' });
    assert.equal(res.status, 403);
  });

  it('returns inbox list', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(ChatService, 'inboxForUser').resolves([2, 3]);
    const res = await request(app)
      .get('/messages/inbox')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });
});

