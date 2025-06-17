const {
  createInsuranceDetail,
  getInsuranceDetailById,
  updateInsuranceDetail,
  deleteInsuranceDetail,
} = require('../repositories/insurance.repo.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');

class InsuranceService {
  static async create(data, req) {
    const userId = req.user.sub;
    if (!userId) {
      throw new BadRequestError('user-id header required', '4001');
    }
    const insuranceDetail = {
      ...data,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await createInsuranceDetail(insuranceDetail);
    if (!result) {
      throw new ForbiddenError('Failed to create insurance detail', '4031');
    }
    return result;
  }
  static async getByID(req) {
    const userId = req.user.sub;
    const result = await getInsuranceDetailById(userId);
    if (!result) {
      throw new ForbiddenError('Insurance detail not found', '4032');
    }
    return result;
  }
  static async update(req, data) {
    const userId = req.user.sub;
    const result = await updateInsuranceDetail(userId, data);
    if (!result) {
      throw new ForbiddenError('Failed to update insurance detail', '4033');
    }
    return result;
  }

  static async delete(req) {
    const userId = req.user.sub;
    const result = await deleteInsuranceDetail(userId);
    if (!result) {
      throw new ForbiddenError('Failed to delete insurance detail', '4034');
    }
    return result;
  }
}

module.exports = InsuranceService;
