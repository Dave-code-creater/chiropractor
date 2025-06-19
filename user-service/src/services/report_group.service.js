const {
  createReportGroup,
  getReportGroupById,
  updateReportGroup,
  deleteReportGroup,
} = require('../repositories/report_group.repo.js');
const { BadRequestError, ForbiddenError } = require('../utils/httpResponses.js');

class ReportGroupService {
  static async create(req) {
    const userId = req.user.sub;
    if (!userId) {
      throw new BadRequestError('user-id header required', '4001');
    }
    const record = {
      user_id: userId,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const result = await createReportGroup(record);
    if (!result) {
      throw new ForbiddenError('Failed to create report group', '4031');
    }
    return result;
  }

  static async getById(id) {
    const result = await getReportGroupById(id);
    if (!result) {
      throw new ForbiddenError('Report group not found', '4032');
    }
    return result;
  }

  static async update(id, data) {
    const result = await updateReportGroup(id, data);
    if (!result) {
      throw new ForbiddenError('Failed to update report group', '4033');
    }
    return result;
  }

  static async delete(id) {
    const result = await deleteReportGroup(id);
    if (!result) {
      throw new ForbiddenError('Failed to delete report group', '4034');
    }
    return result;
  }
}

module.exports = ReportGroupService;
