const {
  createWorkImpact,
  getWorkImpactById,
  updateWorkImpact,
  deleteWorkImpact,
} = require('../repositories/work_impact.repo.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');

class WorkImpactService {
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
    const result = await createWorkImpact(record);
    if (!result) {
      throw new ForbiddenError('Failed to create work impact', '4031');
    }
    return result;
  }

  static async getById(req) {
    const userId = req.user.sub;
    const result = await getWorkImpactById(userId);
    if (!result) {
      throw new ForbiddenError('Work impact not found', '4032');
    }
    return result;
  }

  static async update(req, data) {
    const userId = req.user.sub;
    const result = await updateWorkImpact(userId, data);
    if (!result) {
      throw new ForbiddenError('Failed to update work impact', '4033');
    }
    return result;
  }

  static async delete(req) {
    const userId = req.user.sub;
    const result = await deleteWorkImpact(userId);
    if (!result) {
      throw new ForbiddenError('Failed to delete work impact', '4034');
    }
    return result;
  }
}

module.exports = WorkImpactService;
