const fetch = require('node-fetch');
const baseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

class AuthClient {
  static async getUser(id) {
    const res = await fetch(`${baseUrl}/users/${id}`);
    if (!res.ok) {
      throw new Error('failed to fetch user');
    }
    return res.json();
  }
}

module.exports = AuthClient;
