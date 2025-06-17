const {
  createEmergencyContact,
  getEmergencyContactById,
  updateEmergencyContact,
  deleteEmergencyContact,
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
    const { id } = req.params;
    const result = await getEmergencyContactById(id);
    if (!result) {
      throw new ForbiddenError('Emergency contact not found', '4032');
    }
    return result;
  }
  static async update(req, data) {
    const { id } = req.params;
    const result = await updateEmergencyContact(id, data);
    if (!result) {
      throw new ForbiddenError('Failed to update emergency contact', '4033');
    }
    return result;
  }

  static async delete(req) {
    const { id } = req.params;
    const result = await deleteEmergencyContact(id);
    if (!result) {
      throw new ForbiddenError('Failed to delete emergency contact', '4034');
    }
    return result;
  }
}

module.exports = EmergencyService;
