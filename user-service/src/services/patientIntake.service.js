const {
  createPatientIntake,
  getPatientIntakeById,
  updatePatientIntake,
} = require('../repositories/patientIntake.repo.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');

class PatientIntakeService {
  static async create(data, req) {
    const userId = req.user.sub;
    if (!userId) {
      throw new BadRequestError('user-id header required', '4001');
    }
    const intake = {
      ...data,
      user_id: userId,
      created_at: new Date(),
    };
    const result = await createPatientIntake(intake);
    if (!result) {
      throw new ForbiddenError('Failed to create patient intake', '4031');
    }
    return result;
  }

  static async getById(req) {
    const userId = req.user.sub;
    const result = await getPatientIntakeById(userId);
    if (!result) {
      throw new ForbiddenError('Patient intake not found', '4032');
    }
    return result;
  }

  static async update(req, data) {
    const userId = req.user.sub;
    const result = await updatePatientIntake(userId, data);
    if (!result) {
      throw new ForbiddenError('Failed to update patient intake', '4033');
    }
    return result;
  }
}

module.exports = PatientIntakeService;
