const {
    createDetailsDescription,
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

    static async getById(req) {
        const userId = req.user.sub;
        return await getDetailsDescriptionById(userId);
    }

    static async update(req, data) {
        const userId = req.user.sub;
        const result = await updateDetailsDescription(userId, data);
        if (!result) {
            throw new InternalServerError('Failed to update details description', '5002');
        }
        return result;
    }

    static async delete(req) {
        const userId = req.user.sub;
        const result = await deleteDetailsDescription(userId);
        if (!result) {
            throw new InternalServerError('Failed to delete details description', '5003');
        }
        return result;
    }
}
module.exports = DetailsDescriptionService;
