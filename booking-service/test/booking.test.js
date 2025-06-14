const request = require('supertest');
const sinon = require('sinon');
const repo = require('../src/repositories/booking.repo.js');
const app = require('../src/index.js');
const { strict: assert } = require('assert');
const jwt = require('jsonwebtoken');

describe('booking-service endpoints', () => {
  afterEach(() => sinon.restore());

  it('creates booking', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'createBooking').resolves({ id: 1 });
    const res = await request(app)
      .post('/bookings')
      .set('authorization', 'Bearer token')
      .send({ doctor_id: 1, scheduled_at: '2024-01-01T00:00:00Z', location: 'A' });
    assert.equal(res.status, 201);
  });

  it('gets booking', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'getBookingById').resolves({ id: 1 });
    const res = await request(app)
      .get('/bookings/1')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });

  it('updates booking', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'updateBooking').resolves({ id: 1 });
    const res = await request(app)
      .put('/bookings/1')
      .set('authorization', 'Bearer token')
      .send({ location: 'B' });
    assert.equal(res.status, 200);
  });

  it('deletes booking', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(repo, 'deleteBooking').resolves({ id: 1 });
    const res = await request(app)
      .delete('/bookings/1')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });
});
