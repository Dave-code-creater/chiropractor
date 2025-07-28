const {
  SuccessResponse,
  ErrorResponse
} = require('../utils/httpResponses');
const IncidentService = require('../services/incident.service');
const { error: logError, info } = require('../utils/logger');

/**
 * Incident Controller
 * Clean controller focused only on incident management
 * 
 * Flow: [Routing] -> [Controller] -> [Service] -> [Repository] -> [Database]
 */
class IncidentController {
  // ========================================
  // INCIDENT CRUD OPERATIONS
  // ========================================

  /**
   * Create a new incident
   * POST /api/incidents
   */
  static async createIncident(req, res) {
    const incident = await IncidentService.createIncident(req.body, req);
    return new SuccessResponse('Incident created successfully', 201, incident).send(res);
  }

  /**
   * Get user's incidents
   * GET /api/incidents
   */
  static async getUserIncidents(req, res) {
    // Check if patient_id query parameter is provided
    if (req.query.patient_id) {
      const incidents = await IncidentService.getPatientIncidents(req.query.patient_id, req.query);
      return new SuccessResponse('Patient incidents retrieved successfully', 200, incidents).send(res);
    }

    const incidents = await IncidentService.getUserIncidents(req.user.id, req.query);
    return new SuccessResponse('Incidents retrieved successfully', 200, incidents).send(res);
  }

  /**
   * Get doctor's patients
   * GET /api/incidents/doctor/patients
   */
  static async getDoctorPatients(req, res) {
    if (req.user.role !== 'doctor') {
      return new ErrorResponse('Access denied. Only doctors can access this endpoint.', 403, '4003').send(res);
    }
    const patients = await IncidentService.getDoctorPatients(req.user.id, req.query);
    return new SuccessResponse('Doctor patients retrieved successfully', 200, patients).send(res);
  }

  /**
   * Get incident by ID
   * GET /api/incidents/:id
   */
  static async getIncidentById(req, res) {
    const incident = await IncidentService.getIncidentById(req.params.id, req.user.id);
    return new SuccessResponse('Incident retrieved successfully', 200, incident).send(res);
  }

  /**
   * Update incident
   * PUT /api/incidents/:id
   */
  static async updateIncident(req, res) {
    const incident = await IncidentService.updateIncident(req.params.id, req.body, req.user.id);
    return new SuccessResponse('Incident updated successfully', 200, incident).send(res);
  }

  /**
   * Delete incident
   * DELETE /api/incidents/:id
   */
  static async deleteIncident(req, res) {
    await IncidentService.deleteIncident(req.params.id, req.user.id);
    return new SuccessResponse('Incident deleted successfully', 200).send(res);
  }

  // ========================================
  // INCIDENT FORMS - DEDICATED ENDPOINTS
  // ========================================

  /**
   * Submit Patient Intake Form
   * POST /api/incidents/:id/patient-intake
   */
  static async submitPatientIntakeForm(req, res) {
    try {
      const incidentId = parseInt(req.params.id);
      console.log('👤 Patient Intake Form Submission:', { incidentId, userId: req.user.id });

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      const incident = await IncidentService.getIncidentById(incidentId, req.user.id);
      if (!incident) {
        return new ErrorResponse('Incident not found or access denied', 404, '4042').send(res);
      }

      const savedForm = await IncidentService.createOrUpdateIncidentForm(incidentId, {
        form_type: 'patient_info',
        form_data: req.body,
        is_completed: true
      }, req.user.id);

      console.log('✅ Patient intake form saved:', savedForm.id);

      return new SuccessResponse('Patient intake form submitted successfully', 200, {
        form: savedForm,
        message: 'Patient intake form submitted successfully'
      }).send(res);

    } catch (error) {
      console.error('❌ Patient intake form error:', error);
      logError('Patient intake form submission error:', error);
      return new ErrorResponse('Failed to submit patient intake form', 500, '5001').send(res);
    }
  }

  /**
   * Submit Insurance Details Form
   * POST /api/incidents/:id/insurance-details
   */
  static async submitInsuranceDetailsForm(req, res) {
    try {
      const incidentId = parseInt(req.params.id);
      console.log('🏥 Insurance Details Form Submission:', { incidentId, userId: req.user.id });

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      const incident = await IncidentService.getIncidentById(incidentId, req.user.id);
      if (!incident) {
        return new ErrorResponse('Incident not found or access denied', 404, '4042').send(res);
      }

      const savedForm = await IncidentService.createOrUpdateIncidentForm(incidentId, {
        form_type: 'health_insurance',
        form_data: req.body,
        is_completed: true
      }, req.user.id);

      console.log('✅ Insurance details form saved:', savedForm.id);

      return new SuccessResponse('Insurance details form submitted successfully', 200, {
        form: savedForm,
        message: 'Insurance details form submitted successfully'
      }).send(res);

    } catch (error) {
      console.error('❌ Insurance details form error:', error);
      logError('Insurance details form submission error:', error);
      return new ErrorResponse('Failed to submit insurance details form', 500, '5002').send(res);
    }
  }

  /**
   * Submit Pain Description Form
   * POST /api/incidents/:id/pain-description
   */
  static async submitPainDescriptionForm(req, res) {
    try {
      const incidentId = parseInt(req.params.id);
      console.log('🩹 Pain Description Form Submission:', { incidentId, userId: req.user.id });

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      const incident = await IncidentService.getIncidentById(incidentId, req.user.id);
      if (!incident) {
        return new ErrorResponse('Incident not found or access denied', 404, '4042').send(res);
      }

      const savedForm = await IncidentService.createOrUpdateIncidentForm(incidentId, {
        form_type: 'pain_description',
        form_data: req.body,
        is_completed: true
      }, req.user.id);

      console.log('✅ Pain description form saved:', savedForm.id);

      return new SuccessResponse('Pain description form submitted successfully', 200, {
        form: savedForm,
        message: 'Pain description form submitted successfully'
      }).send(res);

    } catch (error) {
      console.error('❌ Pain description form error:', error);
      logError('Pain description form submission error:', error);
      return new ErrorResponse('Failed to submit pain description form', 500, '5003').send(res);
    }
  }

  /**
   * Submit Pain Assessment Form
   * POST /api/incidents/:id/pain-assessment
   */
  static async submitPainAssessmentForm(req, res) {
    try {
      const incidentId = parseInt(req.params.id);
      console.log('📊 Pain Assessment Form Submission:', { incidentId, userId: req.user.id });

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      const incident = await IncidentService.getIncidentById(incidentId, req.user.id);
      if (!incident) {
        return new ErrorResponse('Incident not found or access denied', 404, '4042').send(res);
      }

      const savedForm = await IncidentService.createOrUpdateIncidentForm(incidentId, {
        form_type: 'pain_assessment',
        form_data: req.body,
        is_completed: true
      }, req.user.id);

      console.log('✅ Pain assessment form saved:', savedForm.id);

      return new SuccessResponse('Pain assessment form submitted successfully', 200, {
        form: savedForm,
        message: 'Pain assessment form submitted successfully'
      }).send(res);

    } catch (error) {
      console.error('❌ Pain assessment form error:', error);
      logError('Pain assessment form submission error:', error);
      return new ErrorResponse('Failed to submit pain assessment form', 500, '5004').send(res);
    }
  }

  /**
   * Submit Lifestyle Impact Form
   * POST /api/incidents/:id/lifestyle-impact
   */
  static async submitLifestyleImpactForm(req, res) {
    try {
      const incidentId = parseInt(req.params.id);
      console.log('💼 Lifestyle Impact Form Submission:', { incidentId, userId: req.user.id });

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      const incident = await IncidentService.getIncidentById(incidentId, req.user.id);
      if (!incident) {
        return new ErrorResponse('Incident not found or access denied', 404, '4042').send(res);
      }

      const savedForm = await IncidentService.createOrUpdateIncidentForm(incidentId, {
        form_type: 'lifestyle_impact',
        form_data: req.body,
        is_completed: true
      }, req.user.id);

      console.log('✅ Lifestyle impact form saved:', savedForm.id);

      return new SuccessResponse('Lifestyle impact form submitted successfully', 200, {
        form: savedForm,
        message: 'Lifestyle impact form submitted successfully'
      }).send(res);

    } catch (error) {
      console.error('❌ Lifestyle impact form error:', error);
      logError('Lifestyle impact form submission error:', error);
      return new ErrorResponse('Failed to submit lifestyle impact form', 500, '5005').send(res);
    }
  }

  /**
   * Submit Medical History Form
   * POST /api/incidents/:id/medical-history
   */
  static async submitMedicalHistoryForm(req, res) {
    try {
      const incidentId = parseInt(req.params.id);
      console.log('📋 Medical History Form Submission:', { incidentId, userId: req.user.id });

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      const incident = await IncidentService.getIncidentById(incidentId, req.user.id);
      if (!incident) {
        return new ErrorResponse('Incident not found or access denied', 404, '4042').send(res);
      }

      const savedForm = await IncidentService.createOrUpdateIncidentForm(incidentId, {
        form_type: 'medical_history',
        form_data: req.body,
        is_completed: true
      }, req.user.id);

      console.log('✅ Medical history form saved:', savedForm.id);

      return new SuccessResponse('Medical history form submitted successfully', 200, {
        form: savedForm,
        message: 'Medical history form submitted successfully'
      }).send(res);

    } catch (error) {
      console.error('❌ Medical history form error:', error);
      logError('Medical history form submission error:', error);
      return new ErrorResponse('Failed to submit medical history form', 500, '5006').send(res);
    }
  }



  // ========================================
  // INCIDENT FORMS MANAGEMENT
  // ========================================

  /**
   * Get available forms for an incident with their completion status
   * GET /api/incidents/:id/available-forms
   */
  static async getAvailableIncidentForms(req, res) {
    try {
      const incidentId = parseInt(req.params.id);

      console.log('📋 Getting available forms for incident:', incidentId);

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      // Get incident with forms
      const incident = await IncidentService.getIncidentById(incidentId, req.user.id);
      if (!incident) {
        return new ErrorResponse('Incident not found', 404, '4042').send(res);
      }

      // Map backend form types to frontend display
      const formDisplayMapping = {
        'patient_info': {
          key: 'patientInfo',
          title: 'Patient Information',
          description: 'Basic patient demographics and contact information',
          icon: '👤',
          required: true
        },
        'health_insurance': {
          key: 'healthInsurance',
          title: 'Health Insurance',
          description: 'Health insurance and coverage information',
          icon: '🏥',
          required: true
        },
        'pain_description': {
          key: 'painDescription',
          title: 'Pain Description',
          description: 'Detailed description of pain symptoms',
          icon: '🩹',
          required: true
        },
        'pain_assessment': {
          key: 'painAssessment',
          title: 'Pain Assessment',
          description: 'Detailed pain evaluation and assessment',
          icon: '📊',
          required: true
        },
        'medical_history': {
          key: 'medicalHistory',
          title: 'Medical History',
          description: 'Previous medical conditions and treatments',
          icon: '📋',
          required: true
        },
        'lifestyle_impact': {
          key: 'lifestyleImpact',
          title: 'Lifestyle Impact',
          description: 'How condition affects daily life and work',
          icon: '💼',
          required: false
        }
      };

      // Get all forms for this incident
      const forms = incident.forms || [];

      // Build available forms list
      const availableForms = forms.map(form => {
        const displayInfo = formDisplayMapping[form.form_type] || {
          key: form.form_type,
          title: form.form_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          description: `${form.form_type} form`,
          icon: '📝',
          required: form.is_required
        };

        return {
          id: form.id,
          backend_type: form.form_type,
          frontend_key: displayInfo.key,
          title: displayInfo.title,
          description: displayInfo.description,
          icon: displayInfo.icon,
          is_required: form.is_required,
          is_completed: form.is_completed,
          has_data: form.form_data && Object.keys(form.form_data).length > 0,
          updated_at: form.updated_at
        };
      });

      // Calculate completion stats
      const totalForms = availableForms.length;
      const completedForms = availableForms.filter(f => f.is_completed).length;
      const requiredForms = availableForms.filter(f => f.is_required).length;
      const requiredCompleted = availableForms.filter(f => f.is_required && f.is_completed).length;

      console.log('📊 Form completion stats:', {
        total: totalForms,
        completed: completedForms,
        required: requiredForms,
        requiredCompleted
      });

      return new SuccessResponse('Available forms retrieved', 200, {
        incident: {
          id: incident.id,
          title: incident.title,
          incident_type: incident.incident_type,
          completion_percentage: totalForms > 0 ? Math.round((completedForms / totalForms) * 100) : 0
        },
        forms: availableForms,
        summary: {
          total: totalForms,
          completed: completedForms,
          required: requiredForms,
          required_completed: requiredCompleted
        }
      }).send(res);

    } catch (error) {
      console.error('❌ Get available forms error:', error);
      logError('Get available forms error:', error);
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      return new ErrorResponse('Failed to get available forms', 500, '5002').send(res);
    }
  }

  /**
   * Submit Patient Info Form
   * POST /api/incidents/:id/patient-info
   */
  static async submitPatientInfoForm(req, res) {
    try {
      const incidentId = parseInt(req.params.id);

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      const savedForm = await IncidentService.createOrUpdateIncidentForm(incidentId, {
        form_type: 'patient_info',
        form_data: req.body,
        is_completed: true
      }, req.user.id);

      return new SuccessResponse('Patient info form submitted successfully', 200, {
        form: savedForm,
        message: 'Patient info form submitted successfully'
      }).send(res);

    } catch (error) {
      logError('Patient info form error:', error);
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      return new ErrorResponse('Failed to submit patient info form', 500, '5001').send(res);
    }
  }

  /**
   * Submit Health Insurance Form
   * POST /api/incidents/:id/health-insurance
   */
  static async submitHealthInsuranceForm(req, res) {
    try {
      const incidentId = parseInt(req.params.id);

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      const savedForm = await IncidentService.createOrUpdateIncidentForm(incidentId, {
        form_type: 'health_insurance',
        form_data: req.body,
        is_completed: true
      }, req.user.id);

      return new SuccessResponse('Health insurance form submitted successfully', 200, {
        form: savedForm,
        message: 'Health insurance form submitted successfully'
      }).send(res);

    } catch (error) {
      logError('Health insurance form error:', error);
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      return new ErrorResponse('Failed to submit health insurance form', 500, '5002').send(res);
    }
  }

  /**
   * Submit Pain Description Form
   * POST /api/incidents/:id/pain-description-form
   */
  static async submitPainDescriptionFormNew(req, res) {
    try {
      const incidentId = parseInt(req.params.id);

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      const savedForm = await IncidentService.createOrUpdateIncidentForm(incidentId, {
        form_type: 'pain_description',
        form_data: req.body,
        is_completed: true
      }, req.user.id);

      return new SuccessResponse('Pain description form submitted successfully', 200, {
        form: savedForm,
        message: 'Pain description form submitted successfully'
      }).send(res);

    } catch (error) {
      logError('Pain description form error:', error);
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      return new ErrorResponse('Failed to submit pain description form', 500, '5003').send(res);
    }
  }

  /**
   * Submit Pain Assessment Form
   * POST /api/incidents/:id/pain-assessment-form
   */
  static async submitPainAssessmentFormNew(req, res) {
    try {
      const incidentId = parseInt(req.params.id);

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      const savedForm = await IncidentService.createOrUpdateIncidentForm(incidentId, {
        form_type: 'pain_assessment',
        form_data: req.body,
        is_completed: true
      }, req.user.id);

      return new SuccessResponse('Pain assessment form submitted successfully', 200, {
        form: savedForm,
        message: 'Pain assessment form submitted successfully'
      }).send(res);

    } catch (error) {
      logError('Pain assessment form error:', error);
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      return new ErrorResponse('Failed to submit pain assessment form', 500, '5004').send(res);
    }
  }

  /**
   * Submit Medical History Form
   * POST /api/incidents/:id/medical-history-form
   */
  static async submitMedicalHistoryFormNew(req, res) {
    try {
      const incidentId = parseInt(req.params.id);

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      const savedForm = await IncidentService.createOrUpdateIncidentForm(incidentId, {
        form_type: 'medical_history',
        form_data: req.body,
        is_completed: true
      }, req.user.id);

      return new SuccessResponse('Medical history form submitted successfully', 200, {
        form: savedForm,
        message: 'Medical history form submitted successfully'
      }).send(res);

    } catch (error) {
      logError('Medical history form error:', error);
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      return new ErrorResponse('Failed to submit medical history form', 500, '5005').send(res);
    }
  }

  /**
   * Submit Lifestyle Impact Form
   * POST /api/incidents/:id/lifestyle-impact-form
   */
  static async submitLifestyleImpactFormNew(req, res) {
    try {
      const incidentId = parseInt(req.params.id);

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      const savedForm = await IncidentService.createOrUpdateIncidentForm(incidentId, {
        form_type: 'lifestyle_impact',
        form_data: req.body,
        is_completed: true
      }, req.user.id);

      return new SuccessResponse('Lifestyle impact form submitted successfully', 200, {
        form: savedForm,
        message: 'Lifestyle impact form submitted successfully'
      }).send(res);

    } catch (error) {
      logError('Lifestyle impact form error:', error);
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      return new ErrorResponse('Failed to submit lifestyle impact form', 500, '5006').send(res);
    }
  }

  // ========================================
  // INCIDENT NOTES
  // ========================================

  /**
   * Add incident note
   * POST /api/incidents/:id/notes
   */
  static async addIncidentNote(req, res) {
    try {
      const incidentId = parseInt(req.params.id);
      const noteData = req.body;

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      const note = await IncidentService.addIncidentNote(incidentId, noteData, req.user.id);

      return new SuccessResponse('Note added successfully', 201, {
        note,
        message: 'Incident note added successfully'
      }).send(res);

    } catch (error) {
      logError('Add incident note error:', error);
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      return new ErrorResponse('Failed to add incident note', 500, '5009').send(res);
    }
  }

  // ========================================
  // TREATMENT PLANS
  // ========================================

  /**
   * Create treatment plan for incident
   * POST /api/incidents/:id/treatment-plan
   */
  static async createTreatmentPlan(req, res) {
    try {
      const incidentId = parseInt(req.params.id);

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      const treatmentPlan = await IncidentService.createTreatmentPlan(incidentId, req.body, req.user.id);

      return new SuccessResponse('Treatment plan created successfully', 201, {
        treatment_plan: treatmentPlan,
        message: 'Treatment plan created successfully'
      }).send(res);

    } catch (error) {
      logError('Create treatment plan error:', error);
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      return new ErrorResponse('Failed to create treatment plan', 500, '5010').send(res);
    }
  }

  /**
   * Get treatment plan for incident
   * GET /api/incidents/:id/treatment-plan
   */
  static async getTreatmentPlan(req, res) {
    try {
      const incidentId = parseInt(req.params.id);

      if (!incidentId || isNaN(incidentId)) {
        return new ErrorResponse('Invalid incident ID', 400, '4001').send(res);
      }

      const treatmentPlan = await IncidentService.getTreatmentPlan(incidentId, req.user.id);

      return new SuccessResponse('Treatment plan retrieved successfully', 200, treatmentPlan).send(res);

    } catch (error) {
      logError('Get treatment plan error:', error);
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      return new ErrorResponse('Failed to get treatment plan', 500, '5011').send(res);
    }
  }

  /**
   * Update treatment plan
   * PUT /api/incidents/:id/treatment-plan/:treatmentPlanId
   */
  static async updateTreatmentPlan(req, res) {
    try {
      const incidentId = parseInt(req.params.id);
      const treatmentPlanId = parseInt(req.params.treatmentPlanId);

      if (!incidentId || isNaN(incidentId) || !treatmentPlanId || isNaN(treatmentPlanId)) {
        return new ErrorResponse('Invalid incident ID or treatment plan ID', 400, '4001').send(res);
      }

      const treatmentPlan = await IncidentService.updateTreatmentPlan(treatmentPlanId, req.body, req.user.id);

      return new SuccessResponse('Treatment plan updated successfully', 200, {
        treatment_plan: treatmentPlan,
        message: 'Treatment plan updated successfully'
      }).send(res);

    } catch (error) {
      logError('Update treatment plan error:', error);
      if (error instanceof ErrorResponse) {
        return error.send(res);
      }
      return new ErrorResponse('Failed to update treatment plan', 500, '5012').send(res);
    }
  }
}

module.exports = IncidentController; 