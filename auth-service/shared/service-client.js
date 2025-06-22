const axios = require('axios');
const CircuitBreaker = require('opossum');

class ServiceClient {
  constructor(serviceName, options = {}) {
    this.serviceName = serviceName;
    this.baseUrl = this.getServiceUrl(serviceName);
    
    // Circuit breaker configuration - optimized for high traffic
    const breakerOptions = {
      timeout: 10000, // Increased to 10 seconds for complex operations
      errorThresholdPercentage: 70, // Increased to 70% - more tolerant of errors
      resetTimeout: 15000, // Reduced to 15 seconds for faster recovery
      volumeThreshold: 20, // Minimum number of requests before circuit can open
      ...options.breaker
    };

    this.breaker = new CircuitBreaker(this.request.bind(this), breakerOptions);
    
    // Setup event handlers
    this.breaker.on('open', () => {
      console.log(`Circuit breaker opened for ${serviceName}`);
    });
    
    this.breaker.on('halfOpen', () => {
      console.log(`Circuit breaker half-opened for ${serviceName}`);
    });
    
    this.breaker.on('close', () => {
      console.log(`Circuit breaker closed for ${serviceName}`);
    });
  }

  getServiceUrl(serviceName) {
    // In Kubernetes, services are accessible via their service names
    // Format: http://service-name.namespace.svc.cluster.local
    const namespace = process.env.K8S_NAMESPACE || 'default';
    
    if (process.env.NODE_ENV === 'production') {
      return `http://${serviceName}.${namespace}.svc.cluster.local`;
    }
    
    // For local development, use environment variables
    const serviceUrls = {
      'auth-service': process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
      'user-service': process.env.USER_SERVICE_URL || 'http://localhost:3002',
      'report-service': process.env.REPORT_SERVICE_URL || 'http://localhost:3003',
      'appointment-service': process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004',
      'chat-service': process.env.CHAT_SERVICE_URL || 'http://localhost:3005',
      'blog-service': process.env.BLOG_SERVICE_URL || 'http://localhost:3006'
    };

    return serviceUrls[serviceName];
  }

  async request(config) {
    try {
      const response = await axios({
        ...config,
        baseURL: this.baseUrl,
        timeout: 15000, // Increased from 5 to 15 seconds
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        }
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(`Service ${this.serviceName} returned ${error.response.status}: ${error.response.data.message}`);
      }
      throw error;
    }
  }

  // Helper methods for common HTTP methods
  async get(path, options = {}) {
    return this.breaker.fire({ method: 'GET', url: path, ...options });
  }

  async post(path, data, options = {}) {
    return this.breaker.fire({ method: 'POST', url: path, data, ...options });
  }

  async put(path, data, options = {}) {
    return this.breaker.fire({ method: 'PUT', url: path, data, ...options });
  }

  async delete(path, options = {}) {
    return this.breaker.fire({ method: 'DELETE', url: path, ...options });
  }

  // Method to forward the original request headers when needed
  async forward(path, originalHeaders = {}, options = {}) {
    const forwardedHeaders = {
      'x-request-id': originalHeaders['x-request-id'],
      'authorization': originalHeaders['authorization'],
      'x-forwarded-for': originalHeaders['x-forwarded-for']
    };

    return this.breaker.fire({
      ...options,
      url: path,
      headers: {
        ...forwardedHeaders,
        ...options.headers
      }
    });
  }
}

module.exports = ServiceClient; 