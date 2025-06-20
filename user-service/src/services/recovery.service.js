const {
  createRecovery,
  listRecoveries,
  getRecoveryById,
  updateRecovery,
  deleteRecovery,
} = require('../repositories/recovery.repo.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');

class RecoveryService {
  static async create(data, req) {
    const userId = req.user.sub;
    if (!userId) {
      throw new BadRequestError('user-id header required', '4001');
    }
    const record = {
      ...data,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const result = await createRecovery(record);
    if (!result) {
      throw new ForbiddenError('Failed to create recovery data', '4031');
    }
    return result;
  }

  static async getById(req) {
    const userId = req.user.sub;
    const id = parseInt(req.params.id, 10);
    const result = await getRecoveryById(userId, id);
    if (!result) {
      throw new ForbiddenError('Recovery data not found', '4032');
    }
    return result;
  }

  static async update(req, data) {
    const userId = req.user.sub;
    const id = parseInt(req.params.id, 10);
    const result = await updateRecovery(userId, id, data);
    if (!result) {
      throw new ForbiddenError('Failed to update recovery data', '4033');
    }
    return result;
  }

  static async delete(req) {
    const userId = req.user.sub;
    const id = parseInt(req.params.id, 10);
    const result = await deleteRecovery(userId, id);
    if (!result) {
      throw new ForbiddenError('Failed to delete recovery data', '4034');
    }
    return result;
  }

  static async list(req) {
    const userId = req.user.sub;
    return listRecoveries(userId);
  }
}

module.exports = RecoveryService;
