const request = require('supertest');
const chai = require('chai');
const spies = require('chai-spies');
chai.use(spies);
const repo = require('../src/repositories/note.repo.js');
const app = require('../src/index.js');
const { expect } = chai;
const jwt = require('jsonwebtoken');

describe('treatment note endpoints', () => {
  afterEach(() => chai.spy.restore());

  it('creates note', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1, role: 'doctor' }));
    const createSpy = chai.spy.on(repo, 'createTreatmentNote', () =>
      Promise.resolve({ id: 1 })
    );
    const res = await request(app)
      .post('/treatment-notes')
      .set('authorization', 'Bearer token')
      .send({ appointment_id: 1 });
    expect(res.status).to.equal(201);
    expect(createSpy).to.have.been.called();
  });

  it('gets note', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1, role: 'doctor' }));
    const getSpy = chai.spy.on(repo, 'getTreatmentNoteById', () =>
      Promise.resolve({ id: 1 })
    );
    const res = await request(app)
      .get('/treatment-notes/1')
      .set('authorization', 'Bearer token');
    expect(res.status).to.equal(200);
    expect(getSpy).to.have.been.called();
  });

  it('updates note', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1, role: 'doctor' }));
    const updateSpy = chai.spy.on(repo, 'updateTreatmentNote', () =>
      Promise.resolve({ id: 1 })
    );
    const res = await request(app)
      .put('/treatment-notes/1')
      .set('authorization', 'Bearer token')
      .send({ content: 'a' });
    expect(res.status).to.equal(200);
    expect(updateSpy).to.have.been.called();
  });
});
