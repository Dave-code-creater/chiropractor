// utils/crypto.js
const crypto = require('crypto');

function generateApiKey() {
    // 32 bytes → 64 hex chars
    return crypto.randomBytes(32).toString('hex');
}

function hashApiKey(keyPlaintext) {
    return crypto.createHash('sha256').update(keyPlaintext).digest('hex');
}

module.exports = { generateApiKey, hashApiKey };
