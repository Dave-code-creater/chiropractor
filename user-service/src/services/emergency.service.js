const {
  createEmergencyContact,
  getEmergencyContactById,
  updateEmergencyContact
} = require('../repositories/emergency.repo.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');

class EmergencyService {
  static async create(data, req) {
    const userId = req.user.sub;
    if (!userId) {
      throw new BadRequestError('user-id header required', '4001');
    }
    const contact = {
      ...data,
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await createEmergencyContact(contact);
    if (!result) {
      throw new ForbiddenError('Failed to create emergency contact', '4031');
    }
    return result;
  }
  static async getByID(req) {
    const userId = req.user.sub;
    const result = await getEmergencyContactById(userId);
    if (!result) {
      throw new ForbiddenError('Emergency contact not found', '4032');
    }
    return result;
  }
  static async update(req, data) {
    const userId = req.user.sub;
    const result = await updateEmergencyContact(userId, data);
    if (!result) {
      throw new ForbiddenError('Failed to update emergency contact', '4033');
    }
    return result;
  }
}

module.exports = EmergencyService;
