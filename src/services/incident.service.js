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

      const { incident_type, title, description, incident_date, doctor_id } = incidentData;
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
        doctor_id: doctor_id || null,
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
   * Get patient incidents
   * @param {number} patientId - Patient ID
   * @param {Object} query - Query parameters
   * @returns {Array} Patient incidents
   */
  static async getPatientIncidents(patientId, query = {}) {
    try {
      const userRepo = getUserRepository();

      const { status, incident_type, page = 1, limit = 20 } = query;
      const offset = (page - 1) * limit;

      const incidents = await userRepo.getIncidentsByPatientId(patientId, {
        status,
        incident_type,
        limit: parseInt(limit),
        offset
      });

      info('Patient incidents retrieved:', {
        patient_id: patientId,
        count: incidents.length
      });

      return incidents.map(incident => IncidentService.formatIncidentResponse(incident));

    } catch (error) {
      logError('Get patient incidents service error:', error);
      throw new InternalServerError('Failed to retrieve patient incidents', '5017');
    }
  }

  /**
   * Get doctor's assigned incidents
   * @param {number} doctorId - Doctor ID
   * @param {Object} query - Query parameters
   * @returns {Array} Doctor's incidents
   */
  static async getDoctorIncidents(doctorId, query = {}) {
    try {
      const userRepo = getUserRepository();

      const { status, incident_type, page = 1, limit = 20 } = query;
      const offset = (page - 1) * limit;

      const incidents = await userRepo.getIncidentsByDoctor({
        doctor_id: doctorId,
        status,
        incident_type,
        limit: parseInt(limit),
        offset
      });

      info('Doctor incidents retrieved:', {
        doctor_id: doctorId,
        count: incidents.length
      });

      return incidents.map(incident => IncidentService.formatIncidentResponse(incident));

    } catch (error) {
      logError('Get doctor incidents service error:', error);
      throw new InternalServerError('Failed to retrieve doctor incidents', '5018');
    }
  }

  /**
   * Get doctor's patients
   * @param {number} userId - User ID of the doctor
   * @param {Object} query - Query parameters
   * @returns {Array} Doctor's patients with incident counts
   */
  static async getDoctorPatients(userId, query = {}) {
    try {
      const userRepo = getUserRepository();

      // Get the doctor ID for this user
      const doctorId = await userRepo.getDoctorIdByUserId(userId);

      if (!doctorId) {
        throw new NotFoundError('Doctor record not found', '4041');
      }

      const { page = 1, limit = 20 } = query;
      const offset = (page - 1) * limit;

      const patients = await userRepo.getDoctorPatients(doctorId, {
        limit: parseInt(limit),
        offset
      });

      info('Doctor patients retrieved:', {
        user_id: userId,
        doctor_id: doctorId,
        count: patients.length
      });

      return patients;

    } catch (error) {
      logError('Get doctor patients service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to retrieve doctor patients', '5018');
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

      // Get user role and doctor info
      const userInfo = await userRepo.getUserRoleAndDoctorInfo(userId);
      if (!userInfo) {
        throw new NotFoundError('User not found', '4041');
      }

      // Check authorization
      const isOwner = incident.user_id === userId;
      const isAssignedDoctor = userInfo.role === 'doctor' && incident.doctor_id === userInfo.doctor_id;
      const isAdmin = userInfo.role === 'admin';

      if (!isOwner && !isAssignedDoctor && !isAdmin) {
        throw new BadRequestError('Access denied. You must be the owner, assigned doctor, or admin to view this incident', '4003');
      }

      // Get forms and notes
      const forms = await userRepo.getIncidentForms(incidentId);
      const notes = await userRepo.getIncidentNotes(incidentId);

      const response = IncidentService.formatIncidentResponse(incident);
      response.forms = forms;
      response.notes = notes;
      response.can_edit = isAssignedDoctor || isAdmin; // Add edit permission flag

      info('Incident retrieved:', {
        incident_id: incidentId,
        accessed_by: userInfo.role,
        is_owner: isOwner,
        is_assigned_doctor: isAssignedDoctor,
        is_admin: isAdmin
      });

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

      // Get user role and doctor info
      const userInfo = await userRepo.getUserRoleAndDoctorInfo(userId);
      if (!userInfo) {
        throw new NotFoundError('User not found', '4041');
      }

      // Check authorization
      const isOwner = incident.user_id === userId;
      const isAssignedDoctor = userInfo.role === 'doctor' && incident.doctor_id === userInfo.doctor_id;
      const isAdmin = userInfo.role === 'admin';

      if (!isAssignedDoctor && !isAdmin && !isOwner) {
        throw new BadRequestError('Access denied. Only the assigned doctor, admin, or owner can update this incident', '4003');
      }

      // Add audit trail for doctor/admin edits
      if (isAssignedDoctor || isAdmin) {
        updateData.last_edited_by = userId;
        updateData.last_edited_at = new Date().toISOString();

        // Add a note about the edit if a reason was provided
        if (updateData.edit_reason) {
          await userRepo.addIncidentNote({
            incident_id: incidentId,
            user_id: userId,
            note_text: `Edit reason: ${updateData.edit_reason}`,
            note_type: 'edit_history'
          });
          delete updateData.edit_reason; // Remove from update data
        }
      }

      const updatedIncident = await userRepo.updateIncident(incidentId, updateData);

      info('Incident updated:', {
        incident_id: incidentId,
        updated_by: userInfo.role,
        is_owner: isOwner,
        is_assigned_doctor: isAssignedDoctor,
        is_admin: isAdmin
      });

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
      general_patient_record: [
        { form_type: 'patient_info', is_required: true },
        { form_type: 'health_insurance', is_required: true },
        { form_type: 'pain_description', is_required: true },
        { form_type: 'pain_assessment', is_required: true },
        { form_type: 'medical_history', is_required: true },
        { form_type: 'lifestyle_impact', is_required: false }
      ]
    };

    return templates[incidentType] || [];
  }

  // ========================================
  // TREATMENT PLAN METHODS
  // ========================================

  /**
   * Create treatment plan for incident
   * @param {number} incidentId - Incident ID
   * @param {Object} treatmentData - Treatment plan data
   * @param {number} userId - User ID (for authorization)
   * @returns {Object} Created treatment plan
   */
  static async createTreatmentPlan(incidentId, treatmentData, userId) {
    try {
      const userRepo = getUserRepository();

      // Check if incident exists and user has access
      const incident = await userRepo.getIncidentById(incidentId);
      if (!incident) {
        throw new NotFoundError('Incident not found', '4042');
      }

      // Get user role and doctor info
      const userInfo = await userRepo.getUserRoleAndDoctorInfo(userId);
      if (!userInfo) {
        throw new NotFoundError('User not found', '4041');
      }

      // Only doctors can create treatment plans
      if (userInfo.role !== 'doctor') {
        throw new BadRequestError('Access denied. Only doctors can create treatment plans', '4003');
      }

      // Check if doctor is assigned to this incident
      if (incident.doctor_id !== userInfo.doctor_id) {
        throw new BadRequestError('Access denied. You can only create treatment plans for your assigned patients', '4003');
      }

      const { patient_id, doctor_id, diagnosis, treatment_goals, additional_notes, treatment_phases } = treatmentData;

      // Create treatment plan
      const treatmentPlan = await userRepo.createTreatmentPlan({
        incident_id: incidentId,
        patient_id: incident.patient_id,
        doctor_id: userInfo.doctor_id,
        diagnosis,
        treatment_goals,
        additional_notes,
        created_by: userId,
        status: 'active'
      });

      // Create treatment phases
      if (treatment_phases && treatment_phases.length > 0) {
        for (let i = 0; i < treatment_phases.length; i++) {
          const phase = treatment_phases[i];
          await userRepo.createTreatmentPhase({
            treatment_plan_id: treatmentPlan.id,
            phase_number: i + 1,
            duration: phase.duration,
            duration_type: phase.duration_type,
            frequency: phase.frequency,
            frequency_type: phase.frequency_type,
            description: phase.description,
            status: 'pending'
          });
        }
      }

      // Get the complete treatment plan with phases
      const completeTreatmentPlan = await userRepo.getTreatmentPlanById(treatmentPlan.id);

      info('Treatment plan created:', {
        incident_id: incidentId,
        treatment_plan_id: treatmentPlan.id,
        created_by: userId
      });

      return IncidentService.formatTreatmentPlanResponse(completeTreatmentPlan);

    } catch (error) {
      logError('Create treatment plan service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to create treatment plan', '5019');
    }
  }

  /**
   * Get treatment plan for incident
   * @param {number} incidentId - Incident ID
   * @param {number} userId - User ID (for authorization)
   * @returns {Object} Treatment plan
   */
  static async getTreatmentPlan(incidentId, userId) {
    try {
      const userRepo = getUserRepository();

      // Check if incident exists and user has access
      const incident = await userRepo.getIncidentById(incidentId);
      if (!incident) {
        throw new NotFoundError('Incident not found', '4042');
      }

      // Check authorization (same as incident access)
      const userInfo = await userRepo.getUserRoleAndDoctorInfo(userId);
      if (!userInfo) {
        throw new NotFoundError('User not found', '4041');
      }

      const isOwner = incident.user_id === userId;
      const isAssignedDoctor = userInfo.role === 'doctor' && incident.doctor_id === userInfo.doctor_id;
      const isAdmin = userInfo.role === 'admin';

      if (!isOwner && !isAssignedDoctor && !isAdmin) {
        throw new BadRequestError('Access denied', '4003');
      }

      // Get treatment plan for this incident
      const treatmentPlan = await userRepo.getTreatmentPlanByIncidentId(incidentId);

      if (!treatmentPlan) {
        return null; // No treatment plan exists yet
      }

      info('Treatment plan retrieved:', {
        incident_id: incidentId,
        treatment_plan_id: treatmentPlan.id
      });

      return IncidentService.formatTreatmentPlanResponse(treatmentPlan);

    } catch (error) {
      logError('Get treatment plan service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to retrieve treatment plan', '5020');
    }
  }

  /**
   * Update treatment plan
   * @param {number} treatmentPlanId - Treatment plan ID
   * @param {Object} updateData - Update data
   * @param {number} userId - User ID (for authorization)
   * @returns {Object} Updated treatment plan
   */
  static async updateTreatmentPlan(treatmentPlanId, updateData, userId) {
    try {
      const userRepo = getUserRepository();

      const treatmentPlan = await userRepo.getTreatmentPlanById(treatmentPlanId);
      if (!treatmentPlan) {
        throw new NotFoundError('Treatment plan not found', '4042');
      }

      // Get user role and doctor info
      const userInfo = await userRepo.getUserRoleAndDoctorInfo(userId);
      if (!userInfo) {
        throw new NotFoundError('User not found', '4041');
      }

      // Only assigned doctor or admin can update
      const isAssignedDoctor = userInfo.role === 'doctor' && treatmentPlan.doctor_id === userInfo.doctor_id;
      const isAdmin = userInfo.role === 'admin';

      if (!isAssignedDoctor && !isAdmin) {
        throw new BadRequestError('Access denied. Only the assigned doctor or admin can update this treatment plan', '4003');
      }

      const updatedTreatmentPlan = await userRepo.updateTreatmentPlan(treatmentPlanId, updateData);

      info('Treatment plan updated:', {
        treatment_plan_id: treatmentPlanId,
        updated_by: userId
      });

      return IncidentService.formatTreatmentPlanResponse(updatedTreatmentPlan);

    } catch (error) {
      logError('Update treatment plan service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to update treatment plan', '5021');
    }
  }

  /**
   * Format treatment plan response
   * @param {Object} treatmentPlan - Raw treatment plan data
   * @returns {Object} Formatted treatment plan
   */
  static formatTreatmentPlanResponse(treatmentPlan) {
    if (!treatmentPlan) return null;

    return {
      id: treatmentPlan.id,
      incident_id: treatmentPlan.incident_id,
      patient_id: treatmentPlan.patient_id,
      doctor_id: treatmentPlan.doctor_id,
      diagnosis: treatmentPlan.diagnosis,
      treatment_goals: treatmentPlan.treatment_goals,
      additional_notes: treatmentPlan.additional_notes,
      status: treatmentPlan.status,
      treatment_phases: treatmentPlan.phases || [],
      patient_name: treatmentPlan.patient_first_name && treatmentPlan.patient_last_name
        ? `${treatmentPlan.patient_first_name} ${treatmentPlan.patient_last_name}`.trim()
        : null,
      doctor_name: treatmentPlan.doctor_first_name && treatmentPlan.doctor_last_name
        ? `${treatmentPlan.doctor_first_name} ${treatmentPlan.doctor_last_name}`.trim()
        : null,
      created_at: treatmentPlan.created_at,
      updated_at: treatmentPlan.updated_at
    };
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
      doctor_id: incident.doctor_id,
      incident_type: incident.incident_type,
      title: incident.title,
      description: incident.description,
      incident_date: incident.date_occurred || incident.incident_date,
      status: incident.status,
      completion_percentage: 0,
      patient_name: incident.patient_first_name && incident.patient_last_name
        ? `${incident.patient_first_name} ${incident.patient_last_name}`.trim()
        : null,
      doctor_name: incident.doctor_first_name && incident.doctor_last_name
        ? `${incident.doctor_first_name} ${incident.doctor_last_name}`.trim()
        : null,
      total_forms: incident.total_forms || 0,
      completed_forms: incident.completed_forms || 0,
      created_at: incident.created_at,
      updated_at: incident.updated_at
    };
  }
}

module.exports = IncidentService; 