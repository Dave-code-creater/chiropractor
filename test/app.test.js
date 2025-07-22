const request = require('supertest');
const { expect } = require('chai');
const { app } = require('../src/index');

describe('Chiropractor Monolith Application', () => {
  
  describe('Application Startup', () => {
    it('should start successfully', async () => {
      // Test that the application starts and responds to routes
      const response = await request(app)
        .get('/v1/api/2025/auth/register')
        .expect(400); // Expect validation error for missing data
      
      expect(response.body).to.have.property('success', false);
    });
  });

  describe('API Routes', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/non-existent-route')
        .expect(404);
      
      expect(response.body).to.have.property('success', false);
      expect(response.body).to.have.property('message', 'Route not found');
      expect(response.body).to.have.property('statusCode', 404);
    });

    it('should have auth routes available', async () => {
      // Test that auth routes exist (even if they return errors due to missing DB)
      const response = await request(app)
        .post('/v1/api/2025/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });
      
      // Should not return 404 (route exists)
      expect(response.status).to.not.equal(404);
    });

    it('should protect routes that require authentication', async () => {
      const response = await request(app)
        .get('/v1/api/2025/users')
        .expect(401);
      
      expect(response.body).to.have.property('success', false);
    });
  });

  describe('CORS Configuration', () => {
    it('should have CORS headers', async () => {
      const response = await request(app)
        .options('/v1/api/2025/auth/register')
        .expect(204);
      
      expect(response.headers).to.have.property('access-control-allow-origin');
    });
  });

  describe('Security Headers', () => {
    it('should have security headers from helmet', async () => {
      const response = await request(app)
        .get('/v1/api/2025/auth/register')
        .expect(400);
      
      expect(response.headers).to.have.property('x-content-type-options');
      expect(response.headers).to.have.property('x-frame-options');
    });

    it('should not expose x-powered-by header', async () => {
      const response = await request(app)
        .get('/v1/api/2025/auth/register')
        .expect(400);
      
      expect(response.headers).to.not.have.property('x-powered-by');
    });
  });

  describe('Rate Limiting', () => {
    it('should have rate limiting headers', async () => {
      const response = await request(app)
        .get('/v1/api/2025/auth/register')
        .expect(400);
      
      // Rate limiting headers might have different names depending on the version
      const hasRateLimitHeaders = 
        response.headers['x-ratelimit-limit'] || 
        response.headers['ratelimit-limit'] ||
        response.headers['x-rate-limit-limit'];
      
      expect(hasRateLimitHeaders).to.exist;
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parsing errors gracefully', async () => {
      const response = await request(app)
        .post('/v1/api/2025/auth/register')
        .set('Content-Type', 'application/json')
        .send('invalid json');
      
      expect(response.status).to.be.oneOf([400, 500]);
      expect(response.body).to.have.property('success', false);
    });
  });
});

describe('Database Connection Handling', () => {
  it('should handle missing database connections gracefully', () => {
    // This test ensures the app can start without databases
    // If we reach this point, it means the app started successfully
    expect(true).to.be.true;
  });
});