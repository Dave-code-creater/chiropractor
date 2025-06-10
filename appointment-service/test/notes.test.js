const request = require('supertest');
const sinon = require('sinon');
const repo = require('../src/repositories/note.repo.js');
const app = require('../src/index.js');
const { strict: assert } = require('assert');
const jwt = require('jsonwebtoken');

describe('treatment note endpoints', () => {
  afterEach(() => sinon.restore());

  it('creates note', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'createTreatmentNote').resolves({ id: 1 });
    const res = await request(app)
      .post('/treatment-notes')
      .set('authorization', 'Bearer token')
      .send({ appointment_id: 1 });
    assert.equal(res.status, 201);
  });

  it('gets note', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'getTreatmentNoteById').resolves({ id: 1 });
    const res = await request(app)
      .get('/treatment-notes/1')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });

  it('updates note', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'updateTreatmentNote').resolves({ id: 1 });
    const res = await request(app)
      .put('/treatment-notes/1')
      .set('authorization', 'Bearer token')
      .send({ content: 'a' });
    assert.equal(res.status, 200);
  });
});
