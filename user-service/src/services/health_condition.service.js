const {
    createHealthCondition,
    getHealthConditionById,
    updateHealthCondition
} = require('../repositories/health_condition.repo');

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
            throw new Error('Failed to create health condition');
        }
        return result;
    }

    static async getById(req) {
        const userId = req.user.sub;
        return await getHealthConditionById(userId);
    }

    static async update(req, data) {
        const userId = req.user.sub;
        const result = await updateHealthCondition(userId, data);
        if (!result) {
            throw new Error('Failed to update health condition');
        }
        return result;
    }
}
module.exports = HealthConditionService;