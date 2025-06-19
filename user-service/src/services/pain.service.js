const {
  createPainDescription,
  listPainDescriptionsByUser,
  getPainDescriptionById,
  updatePainDescription,
  deletePainDescription,
} = require('../repositories/pain.repo.js');

const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');

class PainService {
  static async create(data, req) {
    const userId = req.user.sub;

    if (!userId) {
      throw new BadRequestError('user-id header required', '4001');
    }
    const description = {
      ...data,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await createPainDescription(description);
    if (!result) {
      throw new ForbiddenError('Failed to create pain description', '4031');
    }
    return result;
  }

  static async list(req) {
    const userId = req.user.sub;
    return listPainDescriptionsByUser(userId);
  }

  static async getById(req) {
    const userId = req.user.sub;
    const id = parseInt(req.params.id, 10);
    const result = await getPainDescriptionById(id);
    if (!result || result.user_id !== userId) {
      throw new ForbiddenError('Pain description not found', '4032');
    }
    return result;
  }

  static async update(req, data) {
    const userId = req.user.sub;
    const id = parseInt(req.params.id, 10);

    const result = await updatePainDescription(id, userId, data);
    if (!result) {
      throw new ForbiddenError('Failed to update pain description', '4033');
    }
    return result;
  }

  static async delete(req) {
    const userId = req.user.sub;
    const id = parseInt(req.params.id, 10);
    const result = await deletePainDescription(id, userId);
    if (!result) {
      throw new ForbiddenError('Failed to delete pain description', '4034');
    }
    return result;
  }
}

module.exports = PainService;
