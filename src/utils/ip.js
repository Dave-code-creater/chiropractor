/**
 * IP Address Utilities
 * Helper functions to extract real client IP addresses from requests,
 * especially when behind reverse proxies, load balancers, or CDNs.
 */

/**
 * Get the real client IP address from request headers
 * Handles various proxy headers in order of preference
 * @param {Object} req - Express request object
 * @returns {string} Client IP address
 */
function getRealClientIP(req) {
    // Check various headers that proxies use to pass the real client IP
    const headers = [
        'x-forwarded-for',        // Most common proxy header
        'x-real-ip',              // Nginx proxy header
        'x-client-ip',            // Apache proxy header
        'cf-connecting-ip',       // Cloudflare
        'true-client-ip',         // Akamai, Cloudflare
        'x-original-forwarded-for', // Multiple proxy chains
        'x-forwarded',            // General forwarded header
        'forwarded-for',          // RFC 7239
        'forwarded'               // RFC 7239
    ];

    // Check each header in order of preference
    for (const header of headers) {
        const value = req.headers[header];
        if (value) {
            // X-Forwarded-For can contain multiple IPs (client, proxy1, proxy2, ...)
            // The first IP is usually the real client IP
            const ips = value.split(',').map(ip => ip.trim());
            const clientIP = ips[0];

            // Validate IP format (basic validation)
            if (isValidIP(clientIP)) {
                return clientIP;
            }
        }
    }

    // Fallback to Express's req.ip (which should work with trust proxy)
    if (req.ip) {
        return req.ip;
    }

    // Last resort fallback to connection remote address
    return req.connection?.remoteAddress ||
        req.socket?.remoteAddress ||
        req.connection?.socket?.remoteAddress ||
        'unknown';
}

/**
 * Basic IP address validation
 * @param {string} ip - IP address to validate
 * @returns {boolean} True if valid IP format
 */
function isValidIP(ip) {
    if (!ip || typeof ip !== 'string') return false;

    // Remove any port numbers (e.g., "192.168.1.1:80" -> "192.168.1.1")
    const cleanIP = ip.split(':')[0];

    // Basic IPv4 validation
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (ipv4Regex.test(cleanIP)) {
        const parts = cleanIP.split('.');
        return parts.every(part => {
            const num = parseInt(part, 10);
            return num >= 0 && num <= 255;
        });
    }

    // Basic IPv6 validation (simplified)
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    const ipv6CompressedRegex = /^(([0-9a-fA-F]{1,4}:)*)?::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;

    return ipv6Regex.test(cleanIP) || ipv6CompressedRegex.test(cleanIP);
}

/**
 * Get detailed IP information for debugging
 * @param {Object} req - Express request object
 * @returns {Object} Object containing all IP-related headers
 */
function getIPDebugInfo(req) {
    return {
        expressIP: req.ip,
        connectionRemoteAddress: req.connection?.remoteAddress,
        socketRemoteAddress: req.socket?.remoteAddress,
        headers: {
            'x-forwarded-for': req.headers['x-forwarded-for'],
            'x-real-ip': req.headers['x-real-ip'],
            'x-client-ip': req.headers['x-client-ip'],
            'cf-connecting-ip': req.headers['cf-connecting-ip'],
            'true-client-ip': req.headers['true-client-ip'],
            'x-original-forwarded-for': req.headers['x-original-forwarded-for'],
            'x-forwarded': req.headers['x-forwarded'],
            'forwarded-for': req.headers['forwarded-for'],
            'forwarded': req.headers['forwarded']
        },
        realClientIP: getRealClientIP(req)
    };
}

module.exports = {
    getRealClientIP,
    isValidIP,
    getIPDebugInfo
};
