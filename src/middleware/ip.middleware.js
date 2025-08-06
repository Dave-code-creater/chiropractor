const { getRealClientIP, getIPDebugInfo } = require('../utils/ip');

/**
 * IP Resolution Middleware
 * Adds real client IP information to request object
 */
function ipResolutionMiddleware(req, res, next) {
    // Add the real client IP to the request object
    req.realIP = getRealClientIP(req);

    // Add debug information if in development mode
    if (process.env.NODE_ENV === 'development') {
        req.ipDebug = getIPDebugInfo(req);
    }

    next();
}

module.exports = ipResolutionMiddleware;
