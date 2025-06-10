const {
  createInsuranceDetail,
  getInsuranceDetailById,
  updateInsuranceDetail
} = require('../repositories/insurance.repo.js');
const { createInsuranceDetailValidator } = require('../validate/insurance.validator.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');

class InsuranceService {
  static async create(userIdOrReq, data) {
    let userId = typeof userIdOrReq === 'object' ? Number(userIdOrReq.headers['user-id']) : userIdOrReq;
    let detail = data;
    if (typeof userIdOrReq === 'object') {
      const { error, value } = createInsuranceDetailValidator.validate(userIdOrReq.body);
      if (error) throw new BadRequestError(error.details[0].message);
      detail = value.insurance_detail;
    }
    if (!userId) throw new BadRequestError('user-id header required');
    return createInsuranceDetail({ user_id: userId, ...detail });
  }

  static async getById(id) {
    return getInsuranceDetailById(id);
  }

  static async update(id, data, requester) {
    const existing = await getInsuranceDetailById(id);
    if (!existing) return null;
    if (!requester || !(requester.role === 'doctor' || requester.role === 'staff' || requester.sub === existing.user_id)) {
      throw new ForbiddenError('not allowed');
    }
    return updateInsuranceDetail(id, data);
  }
}

module.exports = InsuranceService;
