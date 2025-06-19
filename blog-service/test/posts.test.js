// test/posts.test.js

// ─── 1) SET JWT ENV BEFORE LOADING APP ──────────────────────────────────────
process.env.JWT_SECRET = 'devsecret';
process.env.JWT_EXPIRES_IN = '1h';

const request = require('supertest');
const chai = require('chai');
const spies = require('chai-spies');
const jwt = require('jsonwebtoken');
const PostService = require('../src/services/post.service.js');
const broker = require('../src/utils/messageBroker.js');
const app = require('../src/index.js');

chai.use(spies);
const { expect } = chai;

describe('📦 blog-service post endpoints (real JWT + RBAC)', () => {
  let doctorToken;
  let patientToken;

  // ─── Generate tokens once ─────────────────────────────────────────────────
  before(() => {
    doctorToken = jwt.sign(
      { sub: 1, role: 'doctor' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    patientToken = jwt.sign(
      { sub: 2, role: 'patient' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  });

  // ─── Make sure no spy lingers from prior tests ─────────────────────────────
  beforeEach(() => {
    chai.spy.restore();
    chai.spy.on(broker, 'publish', () => Promise.resolve());
  });

  afterEach(() => {
    chai.spy.restore();
  });


  // ─── POST /posts  — 201 as doctor ──────────────────────────────────────────
  it('✔️  POST /posts  — 201 with valid doctor token', async () => {
    const fakePost = { _id: 'abc123', title: 't', body: 'b', author: 1 };
    chai.spy.on(PostService, 'create', () => Promise.resolve(fakePost));

    const res = await request(app)
      .post('/posts')
      .set('authorization', `Bearer ${doctorToken}`)
      .send({ title: 't', body: 'b', author: 1 });

    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('metadata').that.deep.equals(fakePost);
    expect(res.body).to.include({
      success: true,
      statusCode: 201,
      message: 'Created'
    });
  });


  // ─── GET /posts/:id  — 200 as doctor or patient ───────────────────────────
  it('✔️  GET /posts/:id  — 200 with valid token', async () => {
    const fakePost = { _id: 'abc123', title: 't', body: 'b', author: 1 };
    chai.spy.on(PostService, 'getById', () => Promise.resolve(fakePost));

    const res = await request(app)
      .get('/posts/abc123')
      .set('authorization', `Bearer ${patientToken}`);  // either role works

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('metadata').that.deep.equals(fakePost);
    expect(res.body).to.include({
      success: true,
      statusCode: 200,
      message: 'OK'
    });
  });


  // ─── malformed / missing tokens ────────────────────────────────────────────
  it('❗ GET /posts/:id  — 401 with malformed token', async () => {
    const res = await request(app)
      .get('/posts/abc123')
      .set('authorization', 'Bearer nope.not.a.jwt');

    expect(res.status).to.equal(401);
    expect(res.body).to.include({ success: false });
    expect(res.body).to.have.property('error').that.matches(/invalid token/i);
  });

  it('❗ GET /posts/:id  — 401 with no token', async () => {
    const res = await request(app).get('/posts/abc123');

    expect(res.status).to.equal(401);
    expect(res.body).to.include({ success: false });
    expect(res.body).to.have.property('error').that.matches(/invalid token/i);
  });


  // ─── RBAC: only doctors may POST ──────────────────────────────────────────
  it('❗️ POST /posts — 403 for non-doctor role', async () => {
    // spy so we can assert it never fires
    const createSpy = chai.spy.on(PostService, 'create', () => Promise.resolve());

    const res = await request(app)
      .post('/posts')
      .set('authorization', `Bearer ${patientToken}`)
      .send({ title: 'forbidden', body: 'nope', author: 2 });

    expect(res.status).to.equal(403);
    expect(res.body).to.include({
      success: false,
      error: 'Forbidden'
    });

    // confirm our service.create was never invoked
    expect(createSpy).to.not.have.been.called();
  });

  it('✔️ GET /tags/:tag/posts — 200 returns posts by tag', async () => {
    const fakePosts = [{ _id: 't1', title: 'one' }];
    chai.spy.on(PostService, 'listByTag', () => Promise.resolve(fakePosts));

    const res = await request(app)
      .get('/tags/news/posts')
      .set('authorization', `Bearer ${patientToken}`);

    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('metadata').that.deep.equals(fakePosts);
  });
});
