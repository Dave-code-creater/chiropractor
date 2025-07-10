const { BadRequestError, NotFoundError, InternalServerError } = require('../utils/httpResponses');
const { getUserRepository, getPatientRepository } = require('../repositories');
const { info, error: logError } = require('../utils/logger');

/**
 * Incident Service
 * Static methods for incident-based reporting business logic
 * 
 * Flow: [Controller] -> [Service] -> [Repository] -> [Database]
 */
class IncidentService {
  /**
   * Create a new incident
   * @param {Object} incidentData - Incident creation data
   * @param {Object} req - Request object
   * @returns {Object} Created incident
   */
  static async createIncident(incidentData, req) {
    try {
      const userRepo = getUserRepository();
      const patientRepo = getPatientRepository();

      const { incident_type, title, description, incident_date } = incidentData;
      const userId = req.user.id;

      // Ensure patient record exists
      let patient = await patientRepo.findByUserId(userId);
      if (!patient) {
        const user = await userRepo.findById(userId);
        if (!user) {
          throw new NotFoundError('User not found', '4041');
        }
        
        // Create basic patient record
        patient = await patientRepo.createPatient({
          user_id: userId,
          first_name: user.username || 'Patient',
          last_name: '',
          email: user.email,
          status: 'active'
        });
      }

      // Create incident
      const incident = await userRepo.createIncident({
        user_id: userId,
        patient_id: patient.id,
        incident_type,
        title,
        description,
        date_occurred: incident_date || new Date().toISOString().split('T')[0],
        status: 'active'
      });

      // Initialize required forms based on incident type
      await IncidentService.initializeIncidentForms(incident.id, incident_type);

      info('Incident created:', { 
        incident_id: incident.id,
        user_id: userId,
        incident_type 
      });

      return IncidentService.formatIncidentResponse(incident);

    } catch (error) {
      logError('Create incident service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to create incident', '5010');
    }
  }

  /**
   * Get user incidents
   * @param {number} userId - User ID
   * @param {Object} query - Query parameters
   * @returns {Array} User incidents
   */
  static async getUserIncidents(userId, query = {}) {
    try {
      const userRepo = getUserRepository();
      
      const { status, incident_type, page = 1, limit = 20 } = query;
      const offset = (page - 1) * limit;

      const incidents = await userRepo.getUserIncidents(userId, {
        status,
        incident_type,
        limit: parseInt(limit),
        offset
      });

      info('User incidents retrieved:', { 
        user_id: userId,
        count: incidents.length 
      });

      return incidents.map(incident => IncidentService.formatIncidentResponse(incident));

    } catch (error) {
      logError('Get user incidents service error:', error);
      throw new InternalServerError('Failed to retrieve incidents', '5011');
    }
  }

  /**
   * Get incident by ID
   * @param {number} incidentId - Incident ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Object} Incident with forms and notes
   */
  static async getIncidentById(incidentId, userId) {
    try {
      const userRepo = getUserRepository();
      
      const incident = await userRepo.getIncidentById(incidentId);
      if (!incident) {
        throw new NotFoundError('Incident not found', '4042');
      }

      // Check ownership
      if (incident.user_id !== userId) {
        throw new BadRequestError('Access denied', '4003');
      }

      // Get forms and notes
      const forms = await userRepo.getIncidentForms(incidentId);
      const notes = await userRepo.getIncidentNotes(incidentId);

      const response = IncidentService.formatIncidentResponse(incident);
      response.forms = forms;
      response.notes = notes;

      info('Incident retrieved:', { incident_id: incidentId });

      return response;

    } catch (error) {
      logError('Get incident by ID service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to retrieve incident', '5012');
    }
  }

  /**
   * Update incident
   * @param {number} incidentId - Incident ID
   * @param {Object} updateData - Update data
   * @param {number} userId - User ID (for authorization)
   * @returns {Object} Updated incident
   */
  static async updateIncident(incidentId, updateData, userId) {
    try {
      const userRepo = getUserRepository();
      
      const incident = await userRepo.getIncidentById(incidentId);
      if (!incident) {
        throw new NotFoundError('Incident not found', '4042');
      }

      // Check ownership
      if (incident.user_id !== userId) {
        throw new BadRequestError('Access denied', '4003');
      }

      const updatedIncident = await userRepo.updateIncident(incidentId, updateData);

      info('Incident updated:', { incident_id: incidentId });

      return IncidentService.formatIncidentResponse(updatedIncident);

    } catch (error) {
      logError('Update incident service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to update incident', '5013');
    }
  }

  /**
   * Create or update incident form
   * @param {number} incidentId - Incident ID
   * @param {Object} formData - Form data
   * @param {number} userId - User ID (for authorization)
   * @returns {Object} Created/updated form
   */
  static async createOrUpdateIncidentForm(incidentId, formData, userId) {
    try {
      const userRepo = getUserRepository();
      
      const incident = await userRepo.getIncidentById(incidentId);
      if (!incident) {
        throw new NotFoundError('Incident not found', '4042');
      }

      // Check ownership
      if (incident.user_id !== userId) {
        throw new BadRequestError('Access denied', '4003');
      }

      const form = await userRepo.createOrUpdateIncidentForm({
        incident_id: incidentId,
        form_type: formData.form_type,
        form_data: formData.form_data,
        is_completed: formData.is_completed || false,
        is_required: formData.is_required
      });

      // Update incident completion percentage
      await userRepo.updateIncidentCompletion(incidentId);

      info('Incident form saved:', { 
        incident_id: incidentId,
        form_type: formData.form_type 
      });

      return form;

    } catch (error) {
      logError('Create/update incident form service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to save incident form', '5014');
    }
  }

  /**
   * Add incident note
   * @param {number} incidentId - Incident ID
   * @param {Object} noteData - Note data
   * @param {number} userId - User ID
   * @returns {Object} Created note
   */
  static async addIncidentNote(incidentId, noteData, userId) {
    try {
      const userRepo = getUserRepository();
      
      const incident = await userRepo.getIncidentById(incidentId);
      if (!incident) {
        throw new NotFoundError('Incident not found', '4042');
      }

      // Check ownership
      if (incident.user_id !== userId) {
        throw new BadRequestError('Access denied', '4003');
      }

      const note = await userRepo.addIncidentNote({
        incident_id: incidentId,
        user_id: userId,
        note_text: noteData.note_text,
        note_type: noteData.note_type || 'progress'
      });

      info('Incident note added:', { 
        incident_id: incidentId,
        note_id: note.id 
      });

      return note;

    } catch (error) {
      logError('Add incident note service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to add incident note', '5015');
    }
  }

  /**
   * Delete incident
   * @param {number} incidentId - Incident ID
   * @param {number} userId - User ID (for authorization)
   * @returns {boolean} Success status
   */
  static async deleteIncident(incidentId, userId) {
    try {
      const userRepo = getUserRepository();
      
      const incident = await userRepo.getIncidentById(incidentId);
      if (!incident) {
        throw new NotFoundError('Incident not found', '4042');
      }

      // Check ownership
      if (incident.user_id !== userId) {
        throw new BadRequestError('Access denied', '4003');
      }

      const deleted = await userRepo.deleteIncident(incidentId);

      info('Incident deleted:', { incident_id: incidentId });

      return deleted;

    } catch (error) {
      logError('Delete incident service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to delete incident', '5016');
    }
  }

  // Helper methods

  /**
   * Initialize required forms for incident type
   * @param {number} incidentId - Incident ID
   * @param {string} incidentType - Incident type
   */
  static async initializeIncidentForms(incidentId, incidentType) {
    const userRepo = getUserRepository();
    
    const formTemplates = IncidentService.getFormTemplatesByType(incidentType);
    
    for (const template of formTemplates) {
      await userRepo.createOrUpdateIncidentForm({
        incident_id: incidentId,
        form_type: template.form_type,
        form_data: {},
        is_completed: false,
        is_required: template.is_required
      });
    }
  }

  /**
   * Get form templates by incident type
   * @param {string} incidentType - Incident type
   * @returns {Array} Form templates
   */
  static getFormTemplatesByType(incidentType) {
    const templates = {
      car_accident: [
        { form_type: 'patient_info', is_required: true },
        { form_type: 'accident_details', is_required: true },
        { form_type: 'injuries_symptoms', is_required: true },
        { form_type: 'auto_insurance', is_required: true },
        { form_type: 'pain_assessment', is_required: true },
        { form_type: 'work_impact', is_required: false }
      ],
      work_injury: [
        { form_type: 'patient_info', is_required: true },
        { form_type: 'work_incident_details', is_required: true },
        { form_type: 'injuries_symptoms', is_required: true },
        { form_type: 'workers_comp', is_required: true },
        { form_type: 'pain_assessment', is_required: true },
        { form_type: 'work_status_restrictions', is_required: true }
      ],
      sports_injury: [
        { form_type: 'patient_info', is_required: true },
        { form_type: 'sports_incident_details', is_required: true },
        { form_type: 'injuries_symptoms', is_required: true },
        { form_type: 'health_insurance', is_required: true },
        { form_type: 'pain_assessment', is_required: true },
        { form_type: 'activity_impact', is_required: false }
      ],
      general_pain: [
        { form_type: 'patient_info', is_required: true },
        { form_type: 'pain_description', is_required: true },
        { form_type: 'medical_history', is_required: true },
        { form_type: 'health_insurance', is_required: true },
        { form_type: 'pain_assessment', is_required: true },
        { form_type: 'lifestyle_impact', is_required: false }
      ]
    };

    return templates[incidentType] || [];
  }

  /**
   * Format incident response
   * @param {Object} incident - Raw incident data
   * @returns {Object} Formatted incident
   */
  static formatIncidentResponse(incident) {
    if (!incident) return null;

    return {
      id: incident.id,
      user_id: incident.user_id,
      patient_id: incident.patient_id,
      incident_type: incident.incident_type,
      title: incident.title,
      description: incident.description,
      incident_date: incident.date_occurred || incident.incident_date,
      status: incident.status,
      completion_percentage: incident.completion_percentage || 0,
      patient_name: incident.patient_first_name && incident.patient_last_name 
        ? `${incident.patient_first_name} ${incident.patient_last_name}`.trim()
        : null,
      total_forms: incident.total_forms || 0,
      completed_forms: incident.completed_forms || 0,
      created_at: incident.created_at,
      updated_at: incident.updated_at
    };
  }
}

module.exports = IncidentService; 