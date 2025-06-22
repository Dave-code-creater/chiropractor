const ReportService = require('../services/report.service.js');
const {
  OK,
  Created,
  NoContent,
  BadRequestError
} = require('../utils/httpResponses.js');

// Create new report
const createReport = async (req, res) => {
  const userId = req.user.sub;
  const reportData = {
    ...req.body,
    createdBy: userId,
    assignedTo: req.body.assignedTo || userId
  };
  
  const report = await ReportService.createReport(reportData);
  
  return new Created({
    metadata: report,
    message: 'Report created successfully'
  }).send(res);
};

// Get all reports with filtering and pagination
const getReports = async (req, res) => {
  const userId = req.user.sub;
  const filters = {
    page: parseInt(req.query.page) || 1,
    limit: parseInt(req.query.limit) || 20,
    category: req.query.category || 'all',
    status: req.query.status || 'all',
    search: req.query.search || '',
    sortBy: req.query.sortBy || 'createdAt',
    sortOrder: req.query.sortOrder || 'desc',
    patientId: req.query.patientId,
    userId: userId
  };
  
  const result = await ReportService.getReports(filters);
  
  return new OK({
    metadata: result,
    message: 'Reports retrieved successfully'
  }).send(res);
};

// Get single report by ID
const getReportById = async (req, res) => {
  const { reportId } = req.params;
  const userId = req.user.sub;
  
  const report = await ReportService.getReportById(reportId, userId);
  
  return new OK({
    metadata: report,
    message: 'Report retrieved successfully'
  }).send(res);
};

// Update report
const updateReport = async (req, res) => {
  const { reportId } = req.params;
  const userId = req.user.sub;
  const updateData = req.body;
  
  const report = await ReportService.updateReport(reportId, updateData, userId);
  
  return new OK({
    metadata: report,
    message: 'Report updated successfully'
  }).send(res);
};

// Delete report
const deleteReport = async (req, res) => {
  const { reportId } = req.params;
  const userId = req.user.sub;
  
  await ReportService.deleteReport(reportId, userId);
  
  return new NoContent().send(res);
};

// Submit patient intake form
const submitPatientIntake = async (req, res) => {
  const { reportId } = req.params;
  const userId = req.user.sub;
  const intakeData = req.body;
  
  const intake = await ReportService.submitPatientIntake(reportId, intakeData, userId);
  
  return new Created({
    metadata: intake,
    message: 'Patient intake submitted successfully'
  }).send(res);
};

// Update patient intake form
const updatePatientIntake = async (req, res) => {
  const { reportId, intakeId } = req.params;
  const userId = req.user.sub;
  const updateData = req.body;
  
  const intake = await ReportService.updatePatientIntake(reportId, intakeId, updateData, userId);
  
  return new OK({
    metadata: intake,
    message: 'Patient intake updated successfully'
  }).send(res);
};

// Get patient intake form
const getPatientIntake = async (req, res) => {
  const { reportId } = req.params;
  const userId = req.user.sub;
  
  const intake = await ReportService.getPatientIntake(reportId, userId);
  
  return new OK({
    metadata: intake,
    message: 'Patient intake retrieved successfully'
  }).send(res);
};

// Submit insurance details form
const submitInsuranceDetails = async (req, res) => {
  const { reportId } = req.params;
  const userId = req.user.sub;
  const insuranceData = req.body;
  
  const insurance = await ReportService.submitInsuranceDetails(reportId, insuranceData, userId);
  
  return new Created({
    metadata: insurance,
    message: 'Insurance details submitted successfully'
  }).send(res);
};

// Submit pain evaluation form
const submitPainEvaluation = async (req, res) => {
  const { reportId } = req.params;
  const userId = req.user.sub;
  const painData = req.body;
  
  const pain = await ReportService.submitPainEvaluation(reportId, painData, userId);
  
  return new Created({
    metadata: pain,
    message: 'Pain evaluation submitted successfully'
  }).send(res);
};

// Submit detailed description form
const submitDetailedDescription = async (req, res) => {
  const { reportId } = req.params;
  const userId = req.user.sub;
  const descriptionData = req.body;
  
  const description = await ReportService.submitDetailedDescription(reportId, descriptionData, userId);
  
  return new Created({
    metadata: description,
    message: 'Detailed description submitted successfully'
  }).send(res);
};

// Submit work impact form
const submitWorkImpact = async (req, res) => {
  const { reportId } = req.params;
  const userId = req.user.sub;
  const workData = req.body;
  
  const work = await ReportService.submitWorkImpact(reportId, workData, userId);
  
  return new Created({
    metadata: work,
    message: 'Work impact submitted successfully'
  }).send(res);
};

// Submit health condition form
const submitHealthConditions = async (req, res) => {
  const { reportId } = req.params;
  const userId = req.user.sub;
  const healthData = req.body;
  
  const health = await ReportService.submitHealthConditions(reportId, healthData, userId);
  
  return new Created({
    metadata: health,
    message: 'Health conditions submitted successfully'
  }).send(res);
};

module.exports = {
  createReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  submitPatientIntake,
  updatePatientIntake,
  getPatientIntake,
  submitInsuranceDetails,
  submitPainEvaluation,
  submitDetailedDescription,
  submitWorkImpact,
  submitHealthConditions
}; 