const {
  createRecovery,
  getRecoveryById,
  updateRecovery,
  deleteRecovery,
} = require('../repositories/recovery.repo.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');

class RecoveryService {
  static async create(data, req) {
    const userId = req.user.sub;
    const reportId = parseInt(req.params.id, 10);
    if (!userId) {
      throw new BadRequestError('user-id header required', '4001');
    }
    const record = {
      ...data,
      user_id: userId,
      report_id: reportId,
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
    const reportId = parseInt(req.params.id, 10);
    const result = await getRecoveryById(userId, reportId);
    if (!result) {
      throw new ForbiddenError('Recovery data not found', '4032');
    }
    return result;
  }

  static async update(req, data) {
    const userId = req.user.sub;
    const reportId = parseInt(req.params.id, 10);
    const result = await updateRecovery(userId, reportId, data);
    if (!result) {
      throw new ForbiddenError('Failed to update recovery data', '4033');
    }
    return result;
  }

  static async delete(req) {
    const userId = req.user.sub;
    const reportId = parseInt(req.params.id, 10);
    const result = await deleteRecovery(userId, reportId);
    if (!result) {
      throw new ForbiddenError('Failed to delete recovery data', '4034');
    }
    return result;
  }
}

module.exports = RecoveryService;
