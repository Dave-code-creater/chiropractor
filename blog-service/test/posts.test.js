const request = require('supertest');
const sinon = require('sinon');
const PostService = require('../src/services/post.service.js');
const app = require('../src/index.js');
const { strict: assert } = require('assert');
const jwt = require('jsonwebtoken');

describe('blog-service post endpoints', () => {
  afterEach(() => sinon.restore());

  it('creates post', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(PostService, 'create').resolves({ _id: '1' });
    const res = await request(app)
      .post('/posts')
      .set('authorization', 'Bearer token')
      .send({ title: 't', body: 'b', author: 1 });
    assert.equal(res.status, 201);
  });

  it('gets post', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(PostService, 'getById').resolves({ _id: '1' });
    const res = await request(app)
      .get('/posts/1')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });

  it('lists posts by user', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(PostService, 'listByUser').resolves([{ _id: '1' }]);
    const res = await request(app)
      .get('/users/1/posts')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });
});
