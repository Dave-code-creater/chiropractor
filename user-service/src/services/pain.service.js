const { createPainDescription } = require('../repositories/pain.repo.js');
const { BadRequestError } = require('../utils/httpResponses.js');

class PainService {
  static async create(userId, desc) {
    if (!userId) {
      throw new BadRequestError('user-id header required');
    }
    return createPainDescription({ user_id: userId, ...desc });
  }
}

module.exports = PainService;
