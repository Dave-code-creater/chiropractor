
const DetailsDescriptionService = require('../services/details_description.service');
const {
    CREATED,
    OK,

} = require('../utils/httpResponses');

class DetailsDescriptionController {
    static async create(req, res) {
        const result = await DetailsDescriptionService.create(req.body, req);
        return new CREATED({ metadata: result }).send(res);
    }

    static async list(req, res) {
        const result = await DetailsDescriptionService.list(req);
        return new OK({ metadata: result }).send(res);
    }
    static async update(req, res) {
        const result = await DetailsDescriptionService.update(req, req.body);
        return new OK({ metadata: result }).send(res);
    }

    static async getById(req, res) {
        const result = await DetailsDescriptionService.getById(req);
        return new OK({ metadata: result }).send(res);
    }

    static async delete(req, res) {
        const result = await DetailsDescriptionService.delete(req);
        return new OK({ metadata: result }).send(res);
    }
}

module.exports = DetailsDescriptionController;
