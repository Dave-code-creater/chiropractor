const reportRepo = require('../repositories/report.repo.js');
const {
  CREATED,
  OK,
  NotFoundError,
  InternalServerError,
} = require('../utils/httpResponses.js');

class ReportController {
  static async create(req, res) {
    try {
      const report = await reportRepo.createReport(
        req.body.owner_id,
        req.body.data
      );
      return new CREATED({ metadata: report }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error creating report').send(res);
    }
  }

  static async getById(req, res) {
    try {
      const report = await reportRepo.getReportById(Number(req.params.id));
      if (!report) return new NotFoundError('not found').send(res);
      return new OK({ metadata: report }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error fetching report').send(res);
    }
  }

  static async update(req, res) {
    try {
      const report = await reportRepo.updateReport(
        Number(req.params.id),
        req.body.data
      );
      if (!report) return new NotFoundError('not found').send(res);
      return new OK({ metadata: report }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error updating report').send(res);
    }
  }

  static async list(_req, res) {
    try {
      const reports = await reportRepo.listReports();
      return new OK({ metadata: reports }).send(res);
    } catch (err) {
      console.error(err);
      return new InternalServerError('error listing reports').send(res);
    }
  }

  static async getHealthConditions(req, res) {
    try {
      // Mock health conditions data for now
      // In a real implementation, this would come from a database
      const healthConditions = [
        {
          id: 1,
          name: 'Lower Back Pain',
          category: 'Musculoskeletal',
          severity: 'Moderate',
          status: 'Active',
          diagnosedDate: '2024-01-15',
          description: 'Chronic lower back pain due to poor posture'
        },
        {
          id: 2,
          name: 'Neck Tension',
          category: 'Musculoskeletal',
          severity: 'Mild',
          status: 'Improving',
          diagnosedDate: '2024-02-20',
          description: 'Tension in neck muscles from computer work'
        },
        {
          id: 3,
          name: 'Sciatica',
          category: 'Neurological',
          severity: 'Severe',
          status: 'Under Treatment',
          diagnosedDate: '2024-03-10',
          description: 'Sciatic nerve pain radiating down left leg'
        }
      ];

      // Filter by user if needed
      const userId = req.query.userId || req.user?.sub;
      
      return new OK({ 
        metadata: {
          conditions: healthConditions,
          total: healthConditions.length,
          userId
        }
      }).send(res);
    } catch (err) {
      console.error('Error fetching health conditions:', err);
      return new InternalServerError('error fetching health conditions').send(res);
    }
  }
}

module.exports = ReportController;
