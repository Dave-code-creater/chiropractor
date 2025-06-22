const {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  createPatientIntake,
  updatePatientIntake,
  getPatientIntake,
  createInsuranceDetails,
  createPainEvaluation,
  createDetailedDescription,
  createWorkImpact,
  createHealthConditions
} = require('../repositories/report.repo.js');

const TemplateService = require('./template.service.js');

const {
  BadRequestError,
  NotFoundError,
  ForbiddenError
} = require('../utils/httpResponses.js');

class ReportService {
  // Create a new report
  static async createReport(reportData) {
    try {
      // Validate template if provided
      if (reportData.templateId) {
        const template = await TemplateService.getTemplateById(reportData.templateId);
        reportData.templateData = template;
      }

      // Generate report ID
      const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const report = await createReport({
        id: reportId,
        name: reportData.name || 'Untitled Report',
        template_id: reportData.templateId || null,
        template_data: reportData.templateData || null,
        patient_id: reportData.patientId || null,
        status: 'draft',
        category: reportData.templateData?.category || 'consultation',
        completion_percentage: 0,
        created_by: reportData.createdBy,
        assigned_to: reportData.assignedTo,
        created_at: new Date(),
        updated_at: new Date()
      });

      return this.formatReportResponse(report);
    } catch (error) {
      throw error;
    }
  }

  // Get reports with filtering and pagination
  static async getReports(filters) {
    const result = await getReports(filters);
    
    return {
      reports: result.reports.map(report => this.formatReportResponse(report)),
      pagination: result.pagination
    };
  }

  // Get single report by ID
  static async getReportById(reportId, userId) {
    const report = await getReportById(reportId);
    
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    // Check access permissions
    if (report.created_by !== userId && report.assigned_to !== userId) {
      throw new ForbiddenError('Access denied to this report');
    }

    // Get all form sections
    const sections = {
      patientIntake: await getPatientIntake(reportId).catch(() => null),
      insuranceDetails: null, // Will be implemented
      painEvaluations: null,
      detailsDescriptions: null,
      workImpact: null,
      healthConditions: null
    };

    return {
      ...this.formatReportResponse(report),
      sections
    };
  }

  // Update report
  static async updateReport(reportId, updateData, userId) {
    const existingReport = await getReportById(reportId);
    
    if (!existingReport) {
      throw new NotFoundError('Report not found');
    }

    if (existingReport.created_by !== userId && existingReport.assigned_to !== userId) {
      throw new ForbiddenError('Access denied to this report');
    }

    const updatedReport = await updateReport(reportId, {
      ...updateData,
      updated_at: new Date()
    });

    return this.formatReportResponse(updatedReport);
  }

  // Delete report
  static async deleteReport(reportId, userId) {
    const report = await getReportById(reportId);
    
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.created_by !== userId) {
      throw new ForbiddenError('Only the report creator can delete this report');
    }

    return await deleteReport(reportId);
  }

  // Submit patient intake form
  static async submitPatientIntake(reportId, intakeData, userId) {
    const report = await getReportById(reportId);
    
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.created_by !== userId && report.assigned_to !== userId) {
      throw new ForbiddenError('Access denied to this report');
    }

    // Validate required fields
    const validationRules = TemplateService.getFormValidationRules('PatientIntakeForm');
    for (const field of validationRules.required) {
      if (!intakeData[field]) {
        throw new BadRequestError(`${field} is required`);
      }
    }

    const intakeId = `intake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const intake = await createPatientIntake({
      id: intakeId,
      report_id: reportId,
      ...intakeData,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Update report completion percentage
    await this.updateReportCompletion(reportId);

    return intake;
  }

  // Update patient intake form
  static async updatePatientIntake(reportId, intakeId, updateData, userId) {
    const report = await getReportById(reportId);
    
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.created_by !== userId && report.assigned_to !== userId) {
      throw new ForbiddenError('Access denied to this report');
    }

    const updatedIntake = await updatePatientIntake(intakeId, {
      ...updateData,
      updated_at: new Date()
    });

    return updatedIntake;
  }

  // Get patient intake form
  static async getPatientIntake(reportId, userId) {
    const report = await getReportById(reportId);
    
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.created_by !== userId && report.assigned_to !== userId) {
      throw new ForbiddenError('Access denied to this report');
    }

    return await getPatientIntake(reportId);
  }

  // Submit insurance details form
  static async submitInsuranceDetails(reportId, insuranceData, userId) {
    const report = await getReportById(reportId);
    
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.created_by !== userId && report.assigned_to !== userId) {
      throw new ForbiddenError('Access denied to this report');
    }

    const insuranceId = `insurance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const insurance = await createInsuranceDetails({
      id: insuranceId,
      report_id: reportId,
      ...insuranceData,
      created_at: new Date(),
      updated_at: new Date()
    });

    await this.updateReportCompletion(reportId);
    return insurance;
  }

  // Submit pain evaluation form
  static async submitPainEvaluation(reportId, painData, userId) {
    const report = await getReportById(reportId);
    
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.created_by !== userId && report.assigned_to !== userId) {
      throw new ForbiddenError('Access denied to this report');
    }

    const painId = `pain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const pain = await createPainEvaluation({
      id: painId,
      report_id: reportId,
      pain_map: painData.painEvaluations[0]?.painMap || {},
      form_data: painData.painEvaluations[0]?.formData || {},
      template_info: painData.templateInfo || {},
      created_at: new Date(),
      updated_at: new Date()
    });

    await this.updateReportCompletion(reportId);
    return pain;
  }

  // Submit detailed description form
  static async submitDetailedDescription(reportId, descriptionData, userId) {
    const report = await getReportById(reportId);
    
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.created_by !== userId && report.assigned_to !== userId) {
      throw new ForbiddenError('Access denied to this report');
    }

    const descriptionId = `desc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const description = await createDetailedDescription({
      id: descriptionId,
      report_id: reportId,
      ...descriptionData,
      created_at: new Date(),
      updated_at: new Date()
    });

    await this.updateReportCompletion(reportId);
    return description;
  }

  // Submit work impact form
  static async submitWorkImpact(reportId, workData, userId) {
    const report = await getReportById(reportId);
    
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.created_by !== userId && report.assigned_to !== userId) {
      throw new ForbiddenError('Access denied to this report');
    }

    const workId = `work_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const work = await createWorkImpact({
      id: workId,
      report_id: reportId,
      work_activities: workData.workActivities || [],
      ...workData,
      created_at: new Date(),
      updated_at: new Date()
    });

    await this.updateReportCompletion(reportId);
    return work;
  }

  // Submit health conditions form
  static async submitHealthConditions(reportId, healthData, userId) {
    const report = await getReportById(reportId);
    
    if (!report) {
      throw new NotFoundError('Report not found');
    }

    if (report.created_by !== userId && report.assigned_to !== userId) {
      throw new ForbiddenError('Access denied to this report');
    }

    const healthId = `health_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const health = await createHealthConditions({
      id: healthId,
      report_id: reportId,
      ...healthData,
      created_at: new Date(),
      updated_at: new Date()
    });

    await this.updateReportCompletion(reportId);
    return health;
  }

  // Update report completion percentage
  static async updateReportCompletion(reportId) {
    // Get all sections for this report
    const sections = {
      patientIntake: await getPatientIntake(reportId).catch(() => null),
      // Add other sections as they're implemented
    };

    // Calculate completion percentage
    const totalSections = 6; // Based on your specification
    const completedSections = Object.values(sections).filter(section => section !== null).length;
    const completionPercentage = Math.round((completedSections / totalSections) * 100);

    // Update report status
    const status = completionPercentage === 100 ? 'completed' : 'draft';

    await updateReport(reportId, {
      completion_percentage: completionPercentage,
      status: status,
      updated_at: new Date()
    });
  }

  // Format report response
  static formatReportResponse(report) {
    return {
      id: report.id,
      name: report.name,
      templateId: report.template_id,
      templateData: report.template_data,
      patientId: report.patient_id,
      status: report.status,
      category: report.category,
      createdAt: report.created_at,
      updatedAt: report.updated_at,
      completionPercentage: report.completion_percentage || 0,
      metadata: {
        createdBy: report.created_by,
        assignedTo: report.assigned_to,
        lastModifiedBy: report.created_by // Will be updated when we track modifications
      }
    };
  }
}

module.exports = ReportService; 