const axios = require('axios');

class HealthService {
  static async checkSystemHealth() {
    const services = [
      { name: 'auth-service', url: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001' },
      { name: 'user-service', url: process.env.USER_SERVICE_URL || 'http://user-service:3002' },
      { name: 'blog-service', url: process.env.BLOG_SERVICE_URL || 'http://blog-service:3003' },
      { name: 'chat-service', url: process.env.CHAT_SERVICE_URL || 'http://chat-service:3004' },
      { name: 'appointment-service', url: process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:3005' },
      { name: 'report-service', url: process.env.REPORT_SERVICE_URL || 'http://report-service:3006' }
    ];

    const healthChecks = await Promise.allSettled(
      services.map(service => this.checkServiceHealth(service))
    );

    const serviceStatuses = healthChecks.map((result, index) => ({
      service: services[index].name,
      status: result.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      error: result.status === 'rejected' ? result.reason.message : null
    }));

    const overallStatus = serviceStatuses.every(s => s.status === 'healthy') ? 'healthy' : 'degraded';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      services: serviceStatuses
    };
  }

  static async getDetailedHealthStatus() {
    const basicHealth = await this.checkSystemHealth();
    
    return {
      ...basicHealth,
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      features: {
        authentication: true,
        patientManagement: true,
        appointmentManagement: true,
        medicalReports: true,
        blogSystem: true,
        chatSystem: true,
        dashboardAnalytics: true,
        passwordReset: true
      }
    };
  }

  static async checkServiceHealth(service) {
    try {
      const response = await axios.get(`${service.url}/health`, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Gateway-Health-Check'
        }
      });
      
      return {
        service: service.name,
        status: 'healthy',
        responseTime: response.headers['x-response-time'] || 'unknown'
      };
    } catch (error) {
      throw new Error(`${service.name}: ${error.message}`);
    }
  }
}

module.exports = HealthService; 