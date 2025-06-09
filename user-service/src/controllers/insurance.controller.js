const {
  createInsuranceDetail,
  getInsuranceDetailById,
} = require('../repositories/insurance.repo.js');
const UserService = require('../services/index.service.js');
const {
  createInsuranceDetailValidator,
} = require('../validate/profile.validator.js');
const {
  CREATED,
  OK,
  NotFoundError,
  InternalServerError,
  BadRequestError,
} = require('../utils/httpResponses.js');

class InsuranceDetailController {
  static async create(req, res) {
    try {
      const { error, value } = createInsuranceDetailValidator.validate(req.body);
      if (error) return new BadRequestError(error.details[0].message).send(res);
      const detail = await createInsuranceDetail({
        user_id: Number(req.headers['user-id']),
        ...value.insurance_detail,
      });
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
      const detail = await UserService.updateInsuranceDetail(
        Number(req.params.id),
        req.body,
        req.user
      );
      if (!detail) return new NotFoundError('not found').send(res);
      return new OK({ metadata: detail }).send(res);
    } catch (err) {
      console.error(err);
      if (err.send) return err.send(res);
      return new InternalServerError('error updating detail').send(res);
    }
  }
}

module.exports = InsuranceDetailController;
