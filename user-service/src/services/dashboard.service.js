const PatientRepository = require('../repositories/patient.repo.js');
const { getDb } = require('../config/index.js');

class DashboardService {
  static async getDashboardStats() {
    try {
      // Get patient statistics
      const totalPatients = await PatientRepository.count({});
      const activePatients = await PatientRepository.count({ status: 'active' });
      const newPatientsThisMonth = await PatientRepository.countNewPatientsThisMonth();

      // Get report statistics
      const totalReports = await this.getTotalReports();
      const completedReports = await this.getCompletedReports();
      const pendingReports = await this.getPendingReports();

      // Calculate completion rate
      const completionRate = totalReports > 0 ? Math.round((completedReports / totalReports) * 100) : 0;

      return {
        patients: {
          total: totalPatients,
          active: activePatients,
          inactive: totalPatients - activePatients,
          newThisMonth: newPatientsThisMonth
        },
        reports: {
          total: totalReports,
          completed: completedReports,
          pending: pendingReports,
          completionRate
        },
        overview: {
          totalUsers: totalPatients,
          totalReports,
          completionRate,
          activePatients
        }
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard stats: ${error.message}`);
    }
  }

  static async getAppointmentStats(date) {
    // This would integrate with appointment service
    // For now, return mock data structure
    return {
      date: date || new Date().toISOString().split('T')[0],
      totalAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0,
      pendingAppointments: 0,
      appointmentsByType: [],
      appointmentsByHour: []
    };
  }

  static async getAppointmentReports(startDate, endDate) {
    // This would integrate with appointment service
    return {
      dateRange: { startDate, endDate },
      totalAppointments: 0,
      appointmentTrends: [],
      doctorPerformance: [],
      patientSatisfaction: 0
    };
  }

  static async getPatientReports(startDate, endDate) {
    try {
      const db = getDb();
      
      // Get patient registration trends
      const patientTrends = await db
        .selectFrom('patients')
        .select([
          db.fn('date_trunc', ['day', 'created_at']).as('date'),
          db.fn.count('id').as('count')
        ])
        .where('created_at', '>=', startDate)
        .where('created_at', '<=', endDate)
        .groupBy('date')
        .orderBy('date')
        .execute();

      // Get patient demographics
      const demographics = await db
        .selectFrom('patients')
        .select([
          'gender',
          db.fn.count('id').as('count')
        ])
        .where('created_at', '>=', startDate)
        .where('created_at', '<=', endDate)
        .groupBy('gender')
        .execute();

      return {
        dateRange: { startDate, endDate },
        patientTrends,
        demographics,
        totalPatients: patientTrends.reduce((sum, trend) => sum + parseInt(trend.count), 0)
      };
    } catch (error) {
      throw new Error(`Failed to get patient reports: ${error.message}`);
    }
  }

  static async getTotalReports() {
    const db = getDb();
    
    // Count all report types
    const tables = [
      'patient_intake_responses',
      'insurance_details',
      'pain_descriptions',
      'details_descriptions',
      'health_conditions',
      'recovery_responses',
      'work_impacts'
    ];

    let total = 0;
    for (const table of tables) {
      try {
        const result = await db
          .selectFrom(table)
          .select(db.fn.count('id').as('count'))
          .executeTakeFirst();
        total += parseInt(result.count);
      } catch (error) {
        // Table might not exist, skip
        continue;
      }
    }

    return total;
  }

  static async getCompletedReports() {
    // For now, consider all existing reports as completed
    // In a real scenario, you'd have a status field
    return await this.getTotalReports();
  }

  static async getPendingReports() {
    // For now, return 0 pending reports
    // In a real scenario, you'd count reports with 'pending' status
    return 0;
  }
}

module.exports = DashboardService; 