const request = require('supertest');
const chai = require('chai');
const spies = require('chai-spies');
const PostService = require('../src/services/post.service.js');
const app = require('../src/index.js');
const jwt = require('jsonwebtoken');

chai.use(spies);
const { expect } = chai;

describe('blog-service post endpoints', () => {
  afterEach(() => chai.spy.restore());

  it('creates post', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    chai.spy.on(PostService, 'create', () => Promise.resolve({ _id: '1' }));
    const res = await request(app)
      .post('/posts')
      .set('authorization', 'Bearer token')
      .send({ title: 't', body: 'b', author: 1 });
    expect(res.status).to.equal(201);
  });

  it('gets post', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    chai.spy.on(PostService, 'getById', () => Promise.resolve({ _id: '1' }));
    const res = await request(app)
      .get('/posts/1')
      .set('authorization', 'Bearer token');
    expect(res.status).to.equal(200);
  });

  it('lists posts by user', async () => {
    chai.spy.on(jwt, 'verify', () => ({ sub: 1 }));
    chai.spy.on(PostService, 'listByUser', () => Promise.resolve([{ _id: '1' }]));
    const res = await request(app)
      .get('/users/1/posts')
      .set('authorization', 'Bearer token');
    expect(res.status).to.equal(200);
  });
});
