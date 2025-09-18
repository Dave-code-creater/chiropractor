process.env.NODE_ENV = 'test';

const { expect } = require('chai');
const sinon = require('sinon');

const repositories = require('../../src/repositories');

const blogServicePath = require.resolve('../../src/services/blog.service');

describe('BlogService - CRUD operations', () => {
  let sandbox;
  let userRepoStub;
  let BlogService;

  const baseContent = [{ type: 'paragraph', text: 'Chiropractic care improves spinal health.' }];

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    userRepoStub = {
      findBlogPostBySlug: sandbox.stub(),
      findBlogPostById: sandbox.stub(),
      findAllBlogPosts: sandbox.stub(),
      createBlogPost: sandbox.stub(),
      updateBlogPost: sandbox.stub(),
      deleteBlogPost: sandbox.stub(),
      incrementBlogPostViews: sandbox.stub()
    };

    sandbox.stub(repositories, 'getUserRepository').returns(userRepoStub);

    // Load a fresh copy of BlogService after stubbing dependencies
    delete require.cache[blogServicePath];
    BlogService = require('../../src/services/blog.service');
  });

  afterEach(() => {
    sandbox.restore();
    delete require.cache[blogServicePath];
  });

  it('creates a blog post with nested response data', async () => {
    const requestMock = {
      user: {
        id: 42,
        role: 'doctor',
        first_name: 'Dieu',
        last_name: 'Phan',
        username: 'drphan'
      }
    };

    const postPayload = {
      title: 'Spine Health Essentials',
      content: baseContent,
      category: 'Wellness',
      tags: ['alignment', 'mobility'],
      is_published: true
    };

    userRepoStub.findBlogPostBySlug.resolves(null);
    userRepoStub.createBlogPost.resolves({
      id: 7,
      slug: 'spine-health-essentials',
      title: postPayload.title,
      content: JSON.stringify(postPayload.content),
      excerpt: 'Short summary',
      category: postPayload.category,
      tags: JSON.stringify(postPayload.tags),
      status: 'published',
      featured_image_url: null,
      meta_description: 'Short summary',
      author_id: requestMock.user.id,
      view_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString()
    });

    const result = await BlogService.createBlogPost(postPayload, requestMock);

    expect(userRepoStub.createBlogPost.calledOnce).to.equal(true);
    expect(result).to.include({ id: 7, type: 'blog_post' });
    expect(result).to.have.nested.property('attributes.title', postPayload.title);
    expect(result).to.have.nested.property('attributes.content.blocks').that.is.an('array').with.length(1);
    expect(result).to.have.nested.property('attributes.status.is_published', true);
    expect(result).to.have.nested.property('relationships.author.name', 'Dieu Phan');
    expect(result).to.have.nested.property('metrics.view_count', 0);
  });

  it('retrieves paginated blog posts with nested formatting', async () => {
    userRepoStub.findAllBlogPosts.resolves({
      posts: [{
        id: 9,
        title: 'Ergonomics 101',
        slug: 'ergonomics-101',
        content: JSON.stringify(baseContent),
        excerpt: 'Keep your posture aligned.',
        category: 'Posture',
        tags: JSON.stringify(['desk-work']),
        status: 'published',
        featured_image_url: null,
        meta_description: 'Keep your posture aligned.',
        author_id: 5,
        first_name: 'Jane',
        last_name: 'Doe',
        role: 'doctor',
        view_count: 15,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString()
      }],
      total: 1
    });

    const result = await BlogService.getAllBlogPosts({ limit: 10, page: 1 }, { role: 'admin' });

    expect(userRepoStub.findAllBlogPosts.calledOnce).to.equal(true);
    expect(result.posts).to.be.an('array').with.length(1);
    expect(result.posts[0]).to.have.nested.property('attributes.taxonomy.category.name', 'Posture');
    expect(result.posts[0]).to.have.nested.property('relationships.author.role', 'doctor');
    expect(result).to.have.nested.property('meta.pagination.total_count', 1);
  });

  it('retrieves a single blog post by slug with nested response', async () => {
    userRepoStub.findBlogPostBySlug.resolves({
      id: 11,
      title: 'Stretching Routines',
      slug: 'stretching-routines',
      content: JSON.stringify(baseContent),
      excerpt: 'Daily stretching plan.',
      category: 'Mobility',
      tags: JSON.stringify(['stretching']),
      status: 'published',
      featured_image_url: null,
      meta_description: 'Daily stretching plan.',
      author_id: 2,
      first_name: 'Mark',
      last_name: 'Smith',
      role: 'doctor',
      view_count: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: new Date().toISOString()
    });
    userRepoStub.incrementBlogPostViews.resolves(true);

    const result = await BlogService.getBlogPost('stretching-routines');

    expect(userRepoStub.incrementBlogPostViews.calledWith(11)).to.equal(true);
    expect(result).to.have.nested.property('attributes.title', 'Stretching Routines');
    expect(result).to.have.nested.property('relationships.author.name', 'Mark Smith');
    expect(result).to.have.nested.property('metrics.view_count', 100);
  });

  it('updates a blog post and preserves author relationship data', async () => {
    const existingPost = {
      id: 13,
      title: 'Old Title',
      slug: 'old-title',
      content: JSON.stringify(baseContent),
      excerpt: 'Old excerpt',
      category: 'General',
      tags: JSON.stringify(['old-tag']),
      status: 'draft',
      featured_image_url: null,
      meta_description: 'Old excerpt',
      author_id: 8,
      first_name: 'Emma',
      last_name: 'Lee',
      role: 'admin',
      view_count: 3,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      published_at: null
    };

    userRepoStub.findBlogPostById.resolves(existingPost);
    userRepoStub.findBlogPostBySlug.resolves(null);
    const updatedTimestamp = new Date().toISOString();
    userRepoStub.updateBlogPost.resolves({
      id: 13,
      title: 'Updated Title',
      slug: 'updated-title',
      content: JSON.stringify(baseContent),
      excerpt: 'Old excerpt',
      category: 'General',
      tags: JSON.stringify(['old-tag']),
      status: 'published',
      featured_image_url: null,
      meta_description: 'Old excerpt',
      author_id: 8,
      view_count: 3,
      created_at: existingPost.created_at,
      updated_at: updatedTimestamp,
      published_at: updatedTimestamp
    });

    const result = await BlogService.updateBlogPost(13, {
      title: 'Updated Title',
      is_published: true
    });

    expect(userRepoStub.updateBlogPost.calledOnce).to.equal(true);
    expect(result).to.have.nested.property('attributes.title', 'Updated Title');
    expect(result).to.have.nested.property('attributes.status.state', 'published');
    expect(result).to.have.nested.property('relationships.author.name', 'Emma Lee');
  });

  it('deletes a blog post', async () => {
    userRepoStub.findBlogPostById.resolves({ id: 21 });
    userRepoStub.deleteBlogPost.resolves(true);

    const result = await BlogService.deleteBlogPost(21);

    expect(userRepoStub.deleteBlogPost.calledWith(21)).to.equal(true);
    expect(result).to.equal(true);
  });
});
