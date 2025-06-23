const Joi = require('joi');

/**
 * Environment configuration validator
 * Ensures all required environment variables are present and valid
 */
class EnvValidator {
  constructor() {
    this.schemas = {
      common: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number()
          .integer()
          .min(1000)
          .max(65535)
          .default(3000),
        JWT_SECRET: Joi.string()
          .min(32)
          .required()
          .messages({
            'string.min': 'JWT_SECRET must be at least 32 characters long for security',
            'any.required': 'JWT_SECRET is required'
          }),
        JWT_EXPIRES_IN: Joi.string()
          .default('1h'),
        CORS_ORIGIN: Joi.string()
          .uri()
          .default('http://localhost:5173'),
        LOG_LEVEL: Joi.string()
          .valid('error', 'warn', 'info', 'debug')
          .default('info')
      }),

      database: Joi.object({
        PRO_POSTGRESQL_HOST: Joi.string()
          .hostname()
          .required(),
        PRO_POSTGRESQL_PORT: Joi.number()
          .integer()
          .min(1)
          .max(65535)
          .default(5432),
        PRO_POSTGRESQL_USER: Joi.string()
          .min(1)
          .required(),
        PRO_POSTGRESQL_PASS: Joi.string()
          .min(1)
          .required(),
        PRO_POSTGRESQL_NAME: Joi.string()
          .min(1)
          .required(),
        DATABASE_SSL: Joi.boolean()
          .default(false),
        DATABASE_POOL_MIN: Joi.number()
          .integer()
          .min(0)
          .default(2),
        DATABASE_POOL_MAX: Joi.number()
          .integer()
          .min(1)
          .default(10)
      }),

      mongodb: Joi.object({
        PRO_MONGODB_HOST: Joi.string()
          .hostname()
          .required(),
        PRO_MONGODB_PORT: Joi.number()
          .integer()
          .min(1)
          .max(65535)
          .default(27017),
        PRO_MONGODB_NAME: Joi.string()
          .min(1)
          .required(),
        PRO_MONGODB_USER: Joi.string()
          .allow(''),
        PRO_MONGODB_PASS: Joi.string()
          .allow('')
      }),

      redis: Joi.object({
        REDIS_HOST: Joi.string()
          .hostname()
          .default('localhost'),
        REDIS_PORT: Joi.number()
          .integer()
          .min(1)
          .max(65535)
          .default(6379),
        REDIS_PASSWORD: Joi.string()
          .allow(''),
        REDIS_DB: Joi.number()
          .integer()
          .min(0)
          .max(15)
          .default(0)
      }),

      security: Joi.object({
        RATE_LIMIT_WINDOW_MS: Joi.number()
          .integer()
          .min(1000)
          .default(900000), // 15 minutes
        RATE_LIMIT_MAX_REQUESTS: Joi.number()
          .integer()
          .min(1)
          .default(100),
        BCRYPT_ROUNDS: Joi.number()
          .integer()
          .min(10)
          .max(15)
          .default(12),
        SESSION_SECRET: Joi.string()
          .min(32)
          .when('NODE_ENV', {
            is: 'production',
            then: Joi.required(),
            otherwise: Joi.optional()
          })
      })
    };
  }

  /**
   * Validate environment variables for a specific service
   */
  validate(serviceName, requiredSchemas = ['common']) {
    const envVars = process.env;
    const errors = [];
    const validatedConfig = {};

    // Validate each required schema
    for (const schemaName of requiredSchemas) {
      if (!this.schemas[schemaName]) {
        throw new Error(`Unknown schema: ${schemaName}`);
      }

      const { error, value } = this.schemas[schemaName].validate(envVars, {
        allowUnknown: true,
        stripUnknown: false
      });

      if (error) {
        errors.push({
          schema: schemaName,
          details: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
          }))
        });
      } else {
        Object.assign(validatedConfig, value);
      }
    }

    // Handle validation errors
    if (errors.length > 0) {
      const errorMessage = this.formatValidationErrors(serviceName, errors);
      throw new Error(errorMessage);
    }

    // Set validated values back to process.env
    Object.keys(validatedConfig).forEach(key => {
      if (validatedConfig[key] !== undefined) {
        process.env[key] = String(validatedConfig[key]);
      }
    });

    return validatedConfig;
  }

  /**
   * Format validation errors for readable output
   */
  formatValidationErrors(serviceName, errors) {
    let message = `❌ Environment validation failed for ${serviceName}:\n\n`;
    
    errors.forEach(({ schema, details }) => {
      message += `📋 ${schema.toUpperCase()} Configuration:\n`;
      details.forEach(({ field, message: msg, value }) => {
        message += `  • ${field}: ${msg}`;
        if (value !== undefined) {
          message += ` (current: "${value}")`;
        }
        message += '\n';
      });
      message += '\n';
    });

    message += '💡 Please check your environment variables and try again.\n';
    message += '📚 See documentation for required configuration.';

    return message;
  }

  /**
   * Get service-specific validation requirements
   */
  getServiceRequirements(serviceName) {
    const requirements = {
      'auth-service': ['common', 'database', 'security'],
      'user-service': ['common', 'database'],
      'appointment-service': ['common', 'database'],
      'report-service': ['common', 'database'],
      'blog-service': ['common', 'mongodb'],
      'chat-service': ['common', 'mongodb'],
      'gateway': ['common', 'security']
    };

    return requirements[serviceName] || ['common'];
  }

  /**
   * Validate environment for a specific service
   */
  validateService(serviceName) {
    const requirements = this.getServiceRequirements(serviceName);
    return this.validate(serviceName, requirements);
  }

  /**
   * Check if environment is production
   */
  isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  /**
   * Check if environment is development
   */
  isDevelopment() {
    return process.env.NODE_ENV === 'development';
  }

  /**
   * Check if environment is test
   */
  isTest() {
    return process.env.NODE_ENV === 'test';
  }

  /**
   * Get database configuration for PostgreSQL
   */
  getDatabaseConfig() {
    return {
      host: process.env.PRO_POSTGRESQL_HOST,
      port: parseInt(process.env.PRO_POSTGRESQL_PORT, 10),
      user: process.env.PRO_POSTGRESQL_USER,
      password: process.env.PRO_POSTGRESQL_PASS,
      database: process.env.PRO_POSTGRESQL_NAME,
      ssl: process.env.DATABASE_SSL === 'true',
      pool: {
        min: parseInt(process.env.DATABASE_POOL_MIN, 10),
        max: parseInt(process.env.DATABASE_POOL_MAX, 10)
      }
    };
  }

  /**
   * Get MongoDB configuration
   */
  getMongoConfig() {
    const host = process.env.PRO_MONGODB_HOST;
    const port = process.env.PRO_MONGODB_PORT;
    const database = process.env.PRO_MONGODB_NAME;
    const user = process.env.PRO_MONGODB_USER;
    const password = process.env.PRO_MONGODB_PASS;

    let uri = `mongodb://${host}:${port}/${database}`;
    
    if (user && password) {
      uri = `mongodb://${user}:${password}@${host}:${port}/${database}`;
    }

    return {
      uri,
      options: {
        useUnifiedTopology: true,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000
      }
    };
  }
}

// Export singleton instance
const envValidator = new EnvValidator();

module.exports = {
  EnvValidator,
  envValidator,
  validateService: (serviceName) => envValidator.validateService(serviceName),
  isProduction: () => envValidator.isProduction(),
  isDevelopment: () => envValidator.isDevelopment(),
  isTest: () => envValidator.isTest(),
  getDatabaseConfig: () => envValidator.getDatabaseConfig(),
  getMongoConfig: () => envValidator.getMongoConfig()
}; 