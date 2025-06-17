const { createProfile, updateProfile } = require('../repositories/profile.repo.js');
const EmergencyService = require('./emergency.service.js');
const InsuranceService = require('./insurance.service.js');
const PainService = require('./pain.service.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');
const createProfileValidator = require('../validators/profile.validator.js');

class ProfileService {
  static async create(user, body) {
    console.log(user, body);
    const userId = user.sub;
    if (!userId) {
      throw new BadRequestError('user-id header required');
    }
    const { error, value } = createProfileValidator.validate(body);
    if (error) {
      throw new BadRequestError(error.details[0].message);
    }
    const profile = await createProfile({ ...value.profile, user_id: userId });
    const emergency = await EmergencyService.create(userId, value.emergency_contact);
    const insurance = await InsuranceService.create(userId, value.insurance_detail);
    const pains = [];
    for (const desc of value.pain_descriptions) {
      pains.push(await PainService.create(userId, desc));
    }
    return { profile, emergency, insurance, pain_descriptions: pains };
  }

  static async update(id, data, requester) {
    if (!requester || !(requester.role === 'doctor' || requester.role === 'staff' || requester.sub === id)) {
      throw new ForbiddenError('not allowed');
    }
    return updateProfile(id, data);
  }
}

module.exports = ProfileService;
