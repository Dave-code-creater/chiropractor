const {
    CREATED,
    OK,
} = require('../utils/httpResponses');
const HealthConditionService = require('../services/health_condition.service.js');


class HealthConditionController {
    static async create(req, res) {
        const result = await HealthConditionService.create(req.body, req);
        return new CREATED({ metadata: result }).send(res);
    }

    static async update(req, res) {
        const result = await HealthConditionService.update(req.params.id, req.body);
        return new OK({ metadata: result }).send(res);
    }

    static async getByID(req, res) {
        const result = await HealthConditionService.getByID(req.params.id);
        return new OK({ metadata: result }).send(res);
    }

    static async delete(req, res) {
        const result = await HealthConditionService.delete(req.params.id);
        return new OK({ metadata: result }).send(res);
    }
}
module.exports = HealthConditionController;