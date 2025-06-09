const { createProfile } = require('../repositories/profile.repo.js');
const { createEmergencyContact } = require('../repositories/emergency.repo.js');
const { createInsuranceDetail } = require('../repositories/insurance.repo.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');
const { createProfileValidator } = require('../validators/profile.validator.js');

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
    return { profile, emergency, insurance };
  }

  static async updateProfile(id, data, requester) {
    if (!requester || !(requester.role === 'doctor' || requester.role === 'staff' || requester.sub === id)) {
      throw new ForbiddenError('not allowed');
    }
    const { updateProfile } = require('../repositories/profile.repo.js');
    return updateProfile(id, data);
  }
}

module.exports = UserService;
