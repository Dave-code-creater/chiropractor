const {
  createInsuranceDetail,
  getInsuranceDetailById,
  updateInsuranceDetail
} = require('../repositories/insurance.repo.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');

class InsuranceService {
  static async create(data, req) {
    const id = req.user['sub'];
    if (!id) {
      throw new BadRequestError('user-id header required', '4001');
    }
    const insuranceDetail = {
      ...data,
      user_id: id,
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
    const id = req.user['sub'];
    const result = await getInsuranceDetailById(id);
    if (!result) {
      throw new ForbiddenError('Insurance detail not found', '4032');
    }
    return result;
  }
  static async update(req, data) {
    const id = req.user['sub'];
    const result = await updateInsuranceDetail(id, data);
    if (!result) {
      throw new ForbiddenError('Failed to update insurance detail', '4033');
    }
    return result;
  }
}

module.exports = InsuranceService;
