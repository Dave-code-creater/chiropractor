const request = require('supertest');

/**
 * Generic health check test that can be used by all services
 * @param {Object} app - Express app instance
 * @param {string} serviceName - Name of the service being tested
 */
const runHealthTest = (app, serviceName) => {
  describe(`${serviceName} health`, () => {
    it('returns ok', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });
};

module.exports = runHealthTest; 