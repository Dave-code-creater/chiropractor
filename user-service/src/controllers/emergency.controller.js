const {
  createEmergencyContact,
  getEmergencyContactById,
  updateEmergencyContact,
} = require('../repositories/emergency.repo.js');
const {
  createEmergencyContactValidator,
} = require('../validators/profile.validator.js');
const {
  CREATED,
  OK,
  NotFoundError,
  InternalServerError,
  BadRequestError,
} = require('../utils/httpResponses.js');

class EmergencyContactController {
  static async create(req, res) {
    try {
      const { error, value } = createEmergencyContactValidator.validate(req.body);
      if (error) return new BadRequestError(error.details[0].message).send(res);
      const contact = await createEmergencyContact({
        user_id: Number(req.headers['user-id']),
        ...value.emergency_contact,
      });
      return new CREATED({ metadata: contact }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error creating contact').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const contact = await getEmergencyContactById(Number(req.params.id));
      if (!contact) return new NotFoundError('not found').send(res);
      return new OK({ metadata: contact }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching contact').send(res);
    }
  }

  static async update(req, res) {
    try {
      const contact = await updateEmergencyContact(Number(req.params.id), req.body);
      if (!contact) return new NotFoundError('not found').send(res);
      return new OK({ metadata: contact }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error updating contact').send(res);
    }
  }
}

module.exports = EmergencyContactController;
