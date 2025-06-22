const PatientRepository = require('../repositories/patient.repo.js');
const ReportRepository = require('../repositories/report.repo.js');
const NotesRepository = require('../repositories/notes.repo.js');
const VitalsRepository = require('../repositories/vitals.repo.js');

class PatientService {
  static async getAllPatients({ search, status, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const patients = await PatientRepository.findAll({ 
      search, 
      status, 
      limit: parseInt(limit), 
      offset 
    });
    
    const total = await PatientRepository.count({ search, status });
    
    return {
      patients,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getPatientById(id) {
    const patient = await PatientRepository.findById(id);
    if (!patient) {
      throw new Error('Patient not found');
    }
    return patient;
  }

  static async createPatient(patientData) {
    // Generate patient ID if not provided
    if (!patientData.id) {
      patientData.id = `PAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Calculate age from date of birth
    if (patientData.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(patientData.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      patientData.age = age;
    }

    patientData.status = patientData.status || 'active';
    patientData.totalVisits = 0;
    patientData.createdAt = new Date();
    patientData.updatedAt = new Date();

    return await PatientRepository.create(patientData);
  }

  static async updatePatient(id, updateData) {
    const patient = await PatientRepository.findById(id);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Recalculate age if date of birth is updated
    if (updateData.dateOfBirth) {
      const today = new Date();
      const birthDate = new Date(updateData.dateOfBirth);
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      updateData.age = age;
    }

    updateData.updatedAt = new Date();
    return await PatientRepository.update(id, updateData);
  }

  static async getPatientStats() {
    const totalPatients = await PatientRepository.count({});
    const activePatients = await PatientRepository.count({ status: 'active' });
    const inactivePatients = await PatientRepository.count({ status: 'inactive' });
    const newPatientsThisMonth = await PatientRepository.countNewPatientsThisMonth();

    return {
      totalPatients,
      activePatients,
      inactivePatients,
      newPatientsThisMonth,
      patientGrowth: {
        thisMonth: newPatientsThisMonth,
        percentageChange: 0 // TODO: Calculate based on previous month
      }
    };
  }

  static async getPatientMedicalHistory(patientId) {
    // This would typically fetch from appointments, treatments, etc.
    // For now, return basic structure
    return {
      patientId,
      appointments: [],
      treatments: [],
      medications: [],
      allergies: [],
      conditions: []
    };
  }

  static async getInitialReport(userId) {
    try {
      // Fetch patient reports using the existing report repository
      const reports = await ReportRepository.findByPatientId(userId);
      
      // Get the latest report for the patient
      const latestReport = reports && reports.length > 0 ? reports[0] : null;
      
      // Get recent notes and vitals for comprehensive view
      const [notes, vitals] = await Promise.all([
        NotesRepository.findMany({ 
          filters: { patient_id: userId }, 
          limit: 5,
          orderBy: [{ field: 'created_at', direction: 'DESC' }]
        }),
        VitalsRepository.getLatestByPatient(userId)
      ]);

      return {
        userId,
        latestReport: latestReport || null,
        recentNotes: notes || [],
        latestVitals: vitals || null,
        summary: {
          hasActiveReport: !!latestReport,
          totalReports: reports ? reports.length : 0,
          recentNotesCount: notes ? notes.length : 0,
          hasVitals: !!vitals,
          lastActivity: this.getLastActivityDate(latestReport, notes, vitals)
        }
      };
    } catch (error) {
      throw new Error(`Failed to fetch initial report: ${error.message}`);
    }
  }

  static getLastActivityDate(latestReport, notes, vitals) {
    const dates = [];
    
    if (latestReport && latestReport.updated_at) {
      dates.push(new Date(latestReport.updated_at));
    }
    
    if (notes && notes.length > 0) {
      dates.push(new Date(notes[0].created_at));
    }
    
    if (vitals && vitals.recorded_at) {
      dates.push(new Date(vitals.recorded_at));
    }
    
    return dates.length > 0 ? new Date(Math.max(...dates)) : null;
  }

  static calculateCompletionPercentage(completionStatus) {
    const sections = Object.values(completionStatus);
    const completedSections = sections.filter(Boolean).length;
    return Math.round((completedSections / sections.length) * 100);
  }
}

module.exports = PatientService; 