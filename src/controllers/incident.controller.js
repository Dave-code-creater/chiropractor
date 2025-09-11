const { SuccessResponse, ErrorResponse } = require('../utils/httpResponses');
const IncidentService = require('../services/incident.service');

class IncidentController {
  static async createIncident(req, res) {
    const incident = await IncidentService.createIncident(req.body, req);
    return new SuccessResponse('Incident created successfully', 201, incident).send(res);
  }

  static async getUserIncidents(req, res) {
    if (req.query.patient_id) {
      const incidents = await IncidentService.getPatientIncidents(req.query.patient_id, req.query);
      return new SuccessResponse('Patient incidents retrieved successfully', 200, incidents).send(res);
    }
    
    if (req.query.doctor_id) {
      const incidents = await IncidentService.getDoctorIncidents(req.query.doctor_id, req.query);
      return new SuccessResponse('Doctor incidents retrieved successfully', 200, incidents).send(res);
    }

    const incidents = await IncidentService.getUserIncidents(req.user.id, req.query);
    return new SuccessResponse('Incidents retrieved successfully', 200, incidents).send(res);
  }

  static async getDoctorPatients(req, res) {
    if (req.user.role !== 'doctor') {
      return new ErrorResponse('Access denied. Only doctors can access this endpoint.', 403, '4003').send(res);
    }
    const patients = await IncidentService.getDoctorPatients(req.user.id, req.query);
    return new SuccessResponse('Doctor patients retrieved successfully', 200, patients).send(res);
  }

  static async getIncidentById(req, res) {
    const incident = await IncidentService.getIncidentById(req.params.id, req.user.id);
    return new SuccessResponse('Incident retrieved successfully', 200, incident).send(res);
  }

  static async updateIncident(req, res) {
    const incident = await IncidentService.updateIncident(req.params.id, req.body, req.user.id);
    return new SuccessResponse('Incident updated successfully', 200, incident).send(res);
  }

  static async deleteIncident(req, res) {
    await IncidentService.deleteIncident(req.params.id, req.user.id);
    return new SuccessResponse('Incident deleted successfully', 204).send(res);
  }

  // Form submissions
  static async submitPatientInfoForm(req, res) {
    const formData = { form_type: 'patient_info', form_data: req.body, is_completed: true };
    const result = await IncidentService.createOrUpdateIncidentForm(req.params.id, formData, req.user.id);
    return new SuccessResponse('Patient information form submitted successfully', 200, result).send(res);
  }

  static async submitHealthInsuranceForm(req, res) {
    const formData = { form_type: 'health_insurance', form_data: req.body, is_completed: true };
    const result = await IncidentService.createOrUpdateIncidentForm(req.params.id, formData, req.user.id);
    return new SuccessResponse('Health insurance form submitted successfully', 200, result).send(res);
  }

  static async submitPainDescriptionFormNew(req, res) {
    const formData = { form_type: 'pain_description', form_data: req.body, is_completed: true };
    const result = await IncidentService.createOrUpdateIncidentForm(req.params.id, formData, req.user.id);
    return new SuccessResponse('Pain description form submitted successfully', 200, result).send(res);
  }

  static async submitPainAssessmentFormNew(req, res) {
    const formData = { form_type: 'pain_assessment', form_data: req.body, is_completed: true };
    const result = await IncidentService.createOrUpdateIncidentForm(req.params.id, formData, req.user.id);
    return new SuccessResponse('Pain assessment form submitted successfully', 200, result).send(res);
  }

  static async submitMedicalHistoryFormNew(req, res) {
    const formData = { form_type: 'medical_history', form_data: req.body, is_completed: true };
    const result = await IncidentService.createOrUpdateIncidentForm(req.params.id, formData, req.user.id);
    return new SuccessResponse('Medical history form submitted successfully', 200, result).send(res);
  }

  static async submitLifestyleImpactFormNew(req, res) {
    const formData = { form_type: 'lifestyle_impact', form_data: req.body, is_completed: true };
    const result = await IncidentService.createOrUpdateIncidentForm(req.params.id, formData, req.user.id);
    return new SuccessResponse('Lifestyle impact form submitted successfully', 200, result).send(res);
  }

  static async getAvailableIncidentForms(req, res) {
    const incident = await IncidentService.getIncidentById(req.params.id, req.user.id);
    const forms = IncidentService.getFormTemplatesByType(incident.incident_type);
    return new SuccessResponse('Available forms retrieved successfully', 200, forms).send(res);
  }

  static async addIncidentNote(req, res) {
    const note = await IncidentService.addIncidentNote(req.params.id, req.body, req.user.id);
    return new SuccessResponse('Incident note added successfully', 201, note).send(res);
  }

  // Treatment plans
  static async createTreatmentPlan(req, res) {
    const treatmentPlan = await IncidentService.createTreatmentPlan(req.params.id, req.body, req.user.id);
    return new SuccessResponse('Treatment plan created successfully', 201, treatmentPlan).send(res);
  }

  static async getTreatmentPlan(req, res) {
    const treatmentPlan = await IncidentService.getTreatmentPlan(req.params.id, req.user.id);
    return new SuccessResponse('Treatment plan retrieved successfully', 200, treatmentPlan).send(res);
  }

  static async updateTreatmentPlan(req, res) {
    const treatmentPlan = await IncidentService.updateTreatmentPlan(req.params.id, req.params.treatmentPlanId, req.body, req.user.id);
    return new SuccessResponse('Treatment plan updated successfully', 200, treatmentPlan).send(res);
  }
}

module.exports = IncidentController;