const {
    createHealthCondition,
    listHealthConditionsByUser,
    getHealthConditionById,
    updateHealthCondition,
    deleteHealthCondition,
} = require('../repositories/health_condition.repo');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses');

class HealthConditionService {
    static async create(data, req) {
        const userId = req.user.sub;
        if (!userId) {
            throw new BadRequestError('user-id header required', '4001');
        }
        const condition = {
            ...data,
            user_id: userId,
            created_at: new Date(),
            updated_at: new Date()
        };

        const result = await createHealthCondition(condition);
        if (!result) {
            throw new ForbiddenError('Failed to create health condition', '4031');
        }
        return result;
    }

    static async list(req) {
        const userId = req.user.sub;
        return listHealthConditionsByUser(userId);
    }

    static async getById(req) {
        const userId = req.user.sub;
        const id = parseInt(req.params.id, 10);
        const result = await getHealthConditionById(id);
        if (!result || result.user_id !== userId) {
            throw new ForbiddenError('Health condition not found', '4032');
        }
        return result;
    }

    static async update(req, data) {
        const userId = req.user.sub;
        const id = parseInt(req.params.id, 10);
        const result = await updateHealthCondition(id, userId, data);
        if (!result) {
            throw new ForbiddenError('Failed to update health condition', '4032');
        }
        return result;
    }

    static async delete(req) {
        const userId = req.user.sub;
        const id = parseInt(req.params.id, 10);
        const result = await deleteHealthCondition(id, userId);
        if (!result) {
            throw new ForbiddenError('Failed to delete health condition', '4033');
        }
        return result;
    }
}
module.exports = HealthConditionService;
