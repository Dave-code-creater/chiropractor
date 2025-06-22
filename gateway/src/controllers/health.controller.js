const HealthService = require('../services/health.service.js');
const { OK, InternalServerError } = require('../utils/httpResponses.js');

class HealthController {
  static async healthCheck(req, res) {
    try {
      const healthStatus = await HealthService.checkSystemHealth();
      return new OK({ metadata: healthStatus }).send(res);
    } catch (error) {
      return new InternalServerError('Health check failed').send(res);
    }
  }

  static async detailedHealthCheck(req, res) {
    try {
      const detailedHealth = await HealthService.getDetailedHealthStatus();
      return new OK({ metadata: detailedHealth }).send(res);
    } catch (error) {
      return new InternalServerError('Detailed health check failed').send(res);
    }
  }
}

module.exports = HealthController;
