module.exports = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secure-jwt-secret-key-here-minimum-32-chars',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h'
  },
  
  // Database Configuration
  databases: {
    postgresql: {
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASS || 'password',
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      database: process.env.DB_NAME || 'chiropractor_monolith',
      ssl: process.env.DATABASE_SSL === 'true',
      max: parseInt(process.env.DATABASE_POOL_MAX) || 20,
      min: parseInt(process.env.DATABASE_POOL_MIN) || 2
    },
    mongodb: {
      uri: process.env.MONGO_URI || 'mongodb://localhost:27017/chiropractor_monolith'
    }
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173'
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000
  },
  
  // Security
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },
  
  // External Services
  smtp: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    db: process.env.REDIS_DB || 0
  }
}; 