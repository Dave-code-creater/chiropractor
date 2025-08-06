const express = require('express');
const { getIPDebugInfo } = require('../utils/ip');
const { SuccessResponse } = require('../utils/httpResponses');

const router = express.Router();

/**
 * Debug endpoint to test IP resolution
 * GET /debug/ip
 * Returns detailed IP information for debugging reverse proxy setup
 */
router.get('/ip', (req, res) => {
    const ipInfo = getIPDebugInfo(req);

    const response = new SuccessResponse(
        'IP debug information retrieved successfully',
        200,
        {
            ...ipInfo,
            timestamp: new Date().toISOString(),
            userAgent: req.headers['user-agent'],
            allHeaders: process.env.NODE_ENV === 'development' ? req.headers : 'Only available in development'
        }
    );

    response.send(res);
});

/**
 * Simple health check endpoint
 * GET /debug/health
 */
router.get('/health', (req, res) => {
    const response = new SuccessResponse(
        'Service is healthy',
        200,
        {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            environment: process.env.NODE_ENV,
            clientIP: req.realIP || 'Not available'
        }
    );

    response.send(res);
});

module.exports = router;
