const {
    createPreliminary,
    listPreliminariesByUser,
    getPreliminaryById,
    updatePreliminary,
    deletePreliminary,
} = require('../repositories/preliminary.repo');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');

class Preliminary {
    static async create(data, req) {
        const userId = req.user.sub;

        if (!userId) {
            throw new BadRequestError('user-id header required', '4001');
        }
        const preliminary = {
            ...data,
            user_id: userId,
            created_at: new Date(),
        };

        const result = await createPreliminary(preliminary);
        if (!result) {
            throw new ForbiddenError('Failed to create preliminary data', '4031');
        }
        return result;
    }

    static async list(req) {
        const userId = req.user.sub;
        return listPreliminariesByUser(userId);
    }

    static async getById(req) {
        const userId = req.user.sub;
        const id = parseInt(req.params.id, 10);

        const result = await getPreliminaryById(id);
        if (!result || result.user_id !== userId) {
            throw new ForbiddenError('Preliminary data not found', '4032');
        }
        return result;
    }

    static async update(req, data) {
        const userId = req.user.sub;
        const id = parseInt(req.params.id, 10);

        const result = await updatePreliminary(id, userId, data);
        if (!result) {
            throw new ForbiddenError('Failed to update preliminary data', '4033');
        }
        return result;
    }

    static async delete(req) {
        const userId = req.user.sub;
        const id = parseInt(req.params.id, 10);
        const result = await deletePreliminary(id, userId);
        if (!result) {
            throw new ForbiddenError('Failed to delete preliminary data', '4034');
        }
        return result;
    }
}

module.exports = Preliminary;
