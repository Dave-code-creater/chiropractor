// utils/crypto.js
import crypto from 'crypto';

export function generateApiKey() {
    // 32 bytes → 64 hex chars
    return crypto.randomBytes(32).toString('hex');
}

export function hashApiKey(keyPlaintext) {
    return crypto.createHash('sha256').update(keyPlaintext).digest('hex');
}