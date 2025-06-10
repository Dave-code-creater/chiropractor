const { createInsuranceDetail, updateInsuranceDetail, getInsuranceDetailById } = require('../repositories/insurance.repo.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');
const { createInsuranceDetailValidator } = require('../validate/profile.validator.js');

class InsuranceService {
    static async createInsuranceDetail(req) {
        const userId = Number(req.user["sub"]);
        if (!userId) {
            throw new BadRequestError('User ID is required');
        }

        const { error, value } = createInsuranceDetailValidator.validate(req.body);
        if (error) {
            throw new BadRequestError(error.details[0].message);
        }
        return createInsuranceDetail({
            user_id: userId,
            ...value.insurance_detail,
        });
    }
    static async updateInsuranceDetail(id, data, requester) {
        const existing = await getInsuranceDetailById(id);
        if (!existing) return null;
        if (!requester || !(requester.role === 'doctor' || requester.role === 'staff' || requester.sub === existing.user_id)) {
            throw new ForbiddenError('not allowed');
        }
        return updateInsuranceDetail(id, data);
    }
    static async getInsuranceDetailById(id) {
        const detail = await getInsuranceDetailById(id);
        if (!detail) return null;
        return detail;
    }
    static async getInsuranceDetailByUserId(userId) {
        const detail = await getInsuranceDetailById(userId);
        if (!detail) return null;
        return detail;
    }
    static async getInsuranceDetailByUserIdAndRequester(userId, requester) {
        if (!requester || !(requester.role === 'doctor' || requester.role === 'staff' || requester.sub === userId)) {
            throw new ForbiddenError('not allowed');
        }
        return this.getInsuranceDetailByUserId(userId);
    }
}

module.exports = InsuranceService;