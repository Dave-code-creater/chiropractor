
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
    static async update(req, res) {
        const result = await updateDetailsDescription(req.params.id, req.body);
        return new OK({ metadata: result }).send(res);
    }

    static async getById(req, res) {
        const result = await getDetailsDescriptionById(req.params.id);
        return new OK({ metadata: result }).send(res);
    }

    static async delete(req, res) {
        const result = await DetailsDescriptionService.delete(req.params.id);
        return new OK({ metadata: result }).send(res);
    }
}

module.exports = DetailsDescriptionController;