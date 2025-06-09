const { createProfile } = require('../repositories/profile.repo.js');
const {
  createEmergencyContact,
  updateEmergencyContact,
  getEmergencyContactById,
} = require('../repositories/emergency.repo.js');
const {
  createInsuranceDetail,
  updateInsuranceDetail,
  getInsuranceDetailById,
} = require('../repositories/insurance.repo.js');
const { createPainDescription } = require('../repositories/pain.repo.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');
const { createProfileValidator } = require('../validate/profile.validator.js');

class UserService {
  static async createProfile(req) {
    const userId = Number(req.headers['user-id']);
    if (!userId) {
      throw new BadRequestError('user-id header required');
    }
    const { error, value } = createProfileValidator.validate(req.body);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }
    const profile = await createProfile({ ...value.profile, user_id: userId });
    const emergency = await createEmergencyContact({
      user_id: userId,
      ...value.emergency_contact,
    });
    const insurance = await createInsuranceDetail({
      user_id: userId,
      ...value.insurance_detail,
    });
    const pains = [];
    for (const desc of value.pain_descriptions) {
      pains.push(
        await createPainDescription({ user_id: userId, ...desc })
      );
    }
    return { profile, emergency, insurance, pain_descriptions: pains };
  }

  static async updateProfile(id, data, requester) {
    if (!requester || !(requester.role === 'doctor' || requester.role === 'staff' || requester.sub === id)) {
      throw new ForbiddenError('not allowed');
    }
    const { updateProfile } = require('../repositories/profile.repo.js');
    return updateProfile(id, data);
  }

  static async updateEmergencyContact(id, data, requester) {
    const existing = await getEmergencyContactById(id);
    if (!existing) return null;
    if (!requester || !(requester.role === 'doctor' || requester.role === 'staff' || requester.sub === existing.user_id)) {
      throw new ForbiddenError('not allowed');
    }
    return updateEmergencyContact(id, data);
  }

  static async updateInsuranceDetail(id, data, requester) {
    const existing = await getInsuranceDetailById(id);
    if (!existing) return null;
    if (!requester || !(requester.role === 'doctor' || requester.role === 'staff' || requester.sub === existing.user_id)) {
      throw new ForbiddenError('not allowed');
    }
    return updateInsuranceDetail(id, data);
  }
}

module.exports = UserService;
