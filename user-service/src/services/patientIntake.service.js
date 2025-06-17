const {
  createPatientIntake,
  getPatientIntakeById,
  updatePatientIntake,
} = require('../repositories/patientIntake.repo.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');

const mapFields = (data) => {
  if (!data || typeof data !== 'object') return {};
  const mapped = {};
  for (const [key, value] of Object.entries(data)) {
    // convert camelCase keys to snake_case
    const snake = key
      .replace(/([A-Z])/g, '_$1')
      .replace(/__/g, '_')
      .toLowerCase();
    mapped[snake] = value;
  }
  return mapped;
};

class PatientIntakeService {
  static async create(data, req) {
    const userId = req.user.sub;
    if (!userId) {
      throw new BadRequestError('user-id header required', '4001');
    }
    const mapped = mapFields(data);
    const result = await createPatientIntake(userId, mapped);
    if (!result) {
      throw new ForbiddenError('Failed to create patient intake', '4031');
    }
    return result;
  }

  static async getById(req) {
    const userId = req.user.sub;
    const row = await getPatientIntakeById(userId);
    if (!row) {
      throw new ForbiddenError('Patient intake not found', '4032');
    }
    return row;
  }

  static async update(req, data) {
    const userId = req.user.sub;
    const mapped = mapFields(data);
    const result = await updatePatientIntake(userId, mapped);
    if (!result) {
      throw new ForbiddenError('Failed to update patient intake', '4033');
    }
    return result;
  }
}

module.exports = PatientIntakeService;
