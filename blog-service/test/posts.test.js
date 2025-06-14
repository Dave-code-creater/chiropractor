const request = require('supertest');
const sinon = require('sinon');
const postRepo = require('../src/repositories/post.repo.js');
const mapRepo = require('../src/repositories/mapping.repo.js');
const app = require('../src/index.js');
const { strict: assert } = require('assert');
const jwt = require('jsonwebtoken');

describe('blog-service post endpoints', () => {
  afterEach(() => sinon.restore());

  it('creates post', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(postRepo, 'createPost').resolves({ _id: '1' });
    sinon.stub(mapRepo, 'savePostMapping').resolves({});
    const res = await request(app)
      .post('/posts')
      .set('authorization', 'Bearer token')
      .send({ title: 't', body: 'b', author: 1 });
    assert.equal(res.status, 201);
  });

  it('gets post', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(postRepo, 'getPostById').resolves({ _id: '1' });
    const res = await request(app)
      .get('/posts/1')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });

  it('lists posts by user', async () => {
    sinon.stub(jwt, 'verify').returns({ sub: 1 });
    sinon.stub(mapRepo, 'getMappingsByUserId').resolves([{ mongo_id: '1' }]);
    sinon.stub(postRepo, 'getPostById').resolves({ _id: '1' });
    const res = await request(app)
      .get('/users/1/posts')
      .set('authorization', 'Bearer token');
    assert.equal(res.status, 200);
  });
});
