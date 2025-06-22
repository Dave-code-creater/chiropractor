const services = {
  AUTH: 'auth-service',
  USER: 'user-service',
  REPORT: 'report-service',
  APPOINTMENT: 'appointment-service',
  CHAT: 'chat-service',
  BLOG: 'blog-service',
  DOCTOR: 'doctor-service'
};

const endpoints = {
  AUTH: {
    VERIFY: '/verify',
    LOGIN: '/login',
    REGISTER: '/register'
  },
  USER: {
    PROFILE: '/profiles',
    PATIENT_INTAKE: '/patient-intake',
    HEALTH_CONDITIONS: '/health-conditions',
    PAIN_DESCRIPTIONS: '/pain-descriptions',
    WORK_IMPACT: '/work-impact',
    RECOVERY: '/recovery'
  },
  APPOINTMENT: {
    BASE: '/appointments',
    PROFILE: (id) => `/appointments/${id}/profile`
  },
  DOCTOR: {
    PROFILE: '/doctors',
    AVAILABILITY: (id) => `/doctors/${id}/availability`,
    SPECIALIZATIONS: (id) => `/doctors/${id}/specializations`,
    SCHEDULE: (id) => `/doctors/${id}/schedule`
  },
  CHAT: {
    USERS: '/users',
    CHANNELS: '/channels',
    CONNECTIONS: '/connections',
    MESSAGES: '/messages',
    CONVERSATIONS: '/conversations'
  },
  REPORT: {
    BASE: '/reports'
  },
  BLOG: {
    POSTS: '/posts'
  }
};

// Performance and reliability configuration
const performanceConfig = {
  // Rate limiting (for gateway)
  rateLimiting: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 1000 requests per window
  },
  
  // Circuit breaker settings
  circuitBreaker: {
    timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) || 10000, // 10 seconds
    errorThresholdPercentage: parseInt(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD) || 70, // 70%
    resetTimeout: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT) || 15000, // 15 seconds
    volumeThreshold: parseInt(process.env.CIRCUIT_BREAKER_VOLUME_THRESHOLD) || 20, // 20 requests
  },
  
  // Request timeouts
  timeouts: {
    request: parseInt(process.env.REQUEST_TIMEOUT) || 15000, // 15 seconds
    connection: parseInt(process.env.CONNECTION_TIMEOUT) || 5000, // 5 seconds
  },
  
  // Connection pooling
  connectionPool: {
    maxSockets: parseInt(process.env.MAX_SOCKETS) || 100,
    maxFreeSockets: parseInt(process.env.MAX_FREE_SOCKETS) || 10,
    keepAlive: process.env.KEEP_ALIVE === 'true' || true,
  }
};

module.exports = {
  services,
  endpoints,
  performanceConfig
}; 