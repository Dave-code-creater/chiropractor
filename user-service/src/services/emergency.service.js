const {
  createEmergencyContact,
  getEmergencyContactById,
  updateEmergencyContact
} = require('../repositories/emergency.repo.js');
const { createEmergencyContactValidator } = require('../validate/emergency.validator.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');

class EmergencyService {
  static async create(userIdOrReq, data) {
    let userId = typeof userIdOrReq === 'object' ? Number(userIdOrReq.headers['user-id']) : userIdOrReq;
    let contact = data;
    if (typeof userIdOrReq === 'object') {
      const { error, value } = createEmergencyContactValidator.validate(userIdOrReq.body);
      if (error) throw new BadRequestError(error.details[0].message);
      contact = value.emergency_contact;
    }
    if (!userId) throw new BadRequestError('user-id header required');
    return createEmergencyContact({ user_id: userId, ...contact });
  }

  static async getById(id) {
    return getEmergencyContactById(id);
  }

  static async update(id, data, requester) {
    const existing = await getEmergencyContactById(id);
    if (!existing) return null;
    if (!requester || !(requester.role === 'doctor' || requester.role === 'staff' || requester.sub === existing.user_id)) {
      throw new ForbiddenError('not allowed');
    }
    return updateEmergencyContact(id, data);
  }
}

module.exports = EmergencyService;
