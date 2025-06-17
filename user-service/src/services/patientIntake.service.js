const {
  createPatientIntake,
  getPatientIntakeById,
  updatePatientIntake,
} = require('../repositories/patientIntake.repo.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');

class PatientIntakeService {
  static mapFields(data) {
    const mapping = {
      // camelCase request fields from PATIENT_INFO mapping
      firstName: 'first_name',
      middleName: 'middle_name',
      lastName: 'last_name',
      daysOfBirth: 'day_of_birth',
      monthOfBirth: 'month_of_birth',
      yearOfBirth: 'year_of_birth',
      status: 'marriage_status',
      race: 'race',
      street: 'street',
      homePhone: 'home_phone',
      workAddress: 'work_address',
      workPhone: 'work_phone',
      spousePhone: 'spouse_phone',
      contact1: 'contact1',
      contact1Phone: 'contact1_phone',
      contact1Relationship: 'contact1_relationship',

      // snake_case aliases from previous API design
      street_address: 'street',
      zip_code: 'zip',
      emergency_contact_name: 'contact1',
      emergency_contact_phone: 'contact1_phone',
      emergency_contact_relationship: 'contact1_relationship',
    };

    const transformed = {};
    for (const [key, value] of Object.entries(data)) {
      const mappedKey = mapping[key] || key;
      transformed[mappedKey] = value;
    }
    return transformed;
  }
  static async create(data, req) {
    const userId = req.user.sub;
    if (!userId) {
      throw new BadRequestError('user-id header required', '4001');
    }
    const intake = {
      ...this.mapFields(data),
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
    const result = await updatePatientIntake(userId, this.mapFields(data));
    if (!result) {
      throw new ForbiddenError('Failed to update patient intake', '4033');
    }
    return result;
  }
}

module.exports = PatientIntakeService;
