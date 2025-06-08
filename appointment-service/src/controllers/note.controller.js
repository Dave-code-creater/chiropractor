import { createTreatmentNote, getTreatmentNoteById, updateTreatmentNote } from '../repositories/index.repo.js';
import { CREATED, OK, NotFoundError, InternalServerError } from '../utils/httpResponses.js';

export default class TreatmentNoteController {
  static async create(req, res) {
    try {
      const note = await createTreatmentNote(req.body);
      return new CREATED({ metadata: note }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error creating note').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const note = await getTreatmentNoteById(Number(req.params.id));
      if (!note) return new NotFoundError('not found').send(res);
      return new OK({ metadata: note }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching note').send(res);
    }
  }

  static async update(req, res) {
    try {
      const note = await updateTreatmentNote(Number(req.params.id), req.body);
      if (!note) return new NotFoundError('not found').send(res);
      return new OK({ metadata: note }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error updating note').send(res);
    }
  }
}
