import { createEmergencyContact, getEmergencyContactById, updateEmergencyContact } from '../repositories/index.repo.js';
import { CREATED, OK, NotFoundError, InternalServerError } from '../utils/httpResponses.js';

export default class EmergencyContactController {
  static async create(req, res) {
    try {
      const contact = await createEmergencyContact(req.body);
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
