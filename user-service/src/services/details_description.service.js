const {
    createDetailsDescription,
    listDetailsDescriptionsByUser,
    getDetailsDescriptionById,
    updateDetailsDescription,
    deleteDetailsDescription,
} = require('../repositories/details_description.repo');
const {
    BadRequestError,
    InternalServerError
} = require('../utils/httpResponses');
class DetailsDescriptionService {
    static async create(data, req) {
        const userId = req.user.sub;
        if (!userId) {
            throw new BadRequestError('user-id header required', '4001');
        }
        const description = {
            ...data,
            user_id: userId,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await createDetailsDescription(description);
        if (!result) {
            throw new InternalServerError('Failed to create details description', '5001');
        }
        return result;
    }

    static async list(req) {
        const userId = req.user.sub;
        return listDetailsDescriptionsByUser(userId);
    }

    static async getById(req) {
        const userId = req.user.sub;
        const id = parseInt(req.params.id, 10);
        const result = await getDetailsDescriptionById(id);
        if (!result || result.user_id !== userId) {
            throw new InternalServerError('Details description not found', '5002');
        }
        return result;
    }

    static async update(req, data) {
        const userId = req.user.sub;
        const id = parseInt(req.params.id, 10);
        const result = await updateDetailsDescription(id, userId, data);
        if (!result) {
            throw new InternalServerError('Failed to update details description', '5002');
        }
        return result;
    }

    static async delete(req) {
        const userId = req.user.sub;
        const id = parseInt(req.params.id, 10);
        const result = await deleteDetailsDescription(id, userId);
        if (!result) {
            throw new InternalServerError('Failed to delete details description', '5003');
        }
        return result;
    }
}
module.exports = DetailsDescriptionService;
