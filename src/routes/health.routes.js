const express = require('express');
const { getPostgreSQLPool, getMongooseConnection } = require('../config/database');
const { SuccessResponse } = require('../utils/httpResponses');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        auth: { status: 'active', description: 'Authentication service' },
        users: { status: 'active', description: 'User management service' },
        appointments: { status: 'active', description: 'Appointment scheduling service' },
        blog: { status: 'active', description: 'Blog content service' },
        chat: { status: 'active', description: 'Real-time chat service' },
        reports: { status: 'active', description: 'Analytics and reporting service' }
      },
      databases: {}
    };

    // Check PostgreSQL connection
    try {
      const pgPool = getPostgreSQLPool();
      const client = await pgPool.connect();
      await client.query('SELECT 1');
      client.release();
      
      health.databases.postgresql = {
        status: 'connected',
        type: 'postgresql',
        tables: ['users', 'patients', 'appointments', 'reports', 'api_keys', 'password_resets']
      };
    } catch (pgError) {
      health.databases.postgresql = {
        status: 'disconnected',
        error: pgError.message
      };
      health.status = 'degraded';
    }

    // Check MongoDB connection
    try {
      const mongoConnection = getMongooseConnection();
      if (mongoConnection.readyState === 1) {
        health.databases.mongodb = {
          status: 'connected',
          type: 'mongodb',
          collections: ['posts', 'conversations', 'messages', 'users']
        };
      } else {
        throw new Error('MongoDB not connected');
      }
    } catch (mongoError) {
      health.databases.mongodb = {
        status: 'disconnected',
        error: mongoError.message
      };
      health.status = 'degraded';
    }

    const response = new SuccessResponse('Health check completed', 200, health);
    response.send(res);
  } catch (error) {
    res.status(500).json({
      success: false,
      status: 'unhealthy',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 