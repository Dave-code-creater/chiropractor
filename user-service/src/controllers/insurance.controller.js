const {
  createInsuranceDetail,
  getInsuranceDetailById,
  updateInsuranceDetail,
} = require('../repositories/insurance.repo.js');
const {
  CREATED,
  OK,
  NotFoundError,
  InternalServerError,
} = require('../utils/httpResponses.js');

class InsuranceDetailController {
  static async create(req, res) {
    try {
      const detail = await createInsuranceDetail(req.body);
      return new CREATED({ metadata: detail }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error creating detail').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const detail = await getInsuranceDetailById(Number(req.params.id));
      if (!detail) return new NotFoundError('not found').send(res);
      return new OK({ metadata: detail }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching detail').send(res);
    }
  }

  static async update(req, res) {
    try {
      const detail = await updateInsuranceDetail(Number(req.params.id), req.body);
      if (!detail) return new NotFoundError('not found').send(res);
      return new OK({ metadata: detail }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error updating detail').send(res);
    }
  }
}

module.exports = InsuranceDetailController;
