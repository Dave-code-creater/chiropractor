const EmergencyService = require('../services/emergency.service.js');
const {
  createEmergencyContactValidator,
} = require('../validate/emergency.validator.js');
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
      const contact = await EmergencyService.create(Number(req.headers['user-id']), value.emergency_contact);
      return new CREATED({ metadata: contact }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error creating contact').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const contact = await EmergencyService.getById(Number(req.params.id));
      if (!contact) return new NotFoundError('not found').send(res);
      return new OK({ metadata: contact }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching contact').send(res);
    }
  }

  static async update(req, res) {
    try {
      const contact = await EmergencyService.update(
        Number(req.params.id),
        req.body,
        req.user
      );
      if (!contact) return new NotFoundError('not found').send(res);
      return new OK({ metadata: contact }).send(res);
    } catch (err) {
      console.error(err);
      if (err.send) return err.send(res);
      return new InternalServerError('error updating contact').send(res);
    }
  }
}

module.exports = EmergencyContactController;
