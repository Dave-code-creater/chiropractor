const { BadRequestError, NotFoundError, ConflictError, InternalServerError } = require('../utils/httpResponses');
const { getUserRepository, getPatientRepository, getDoctorRepository } = require('../repositories');
const { patientCreateSchema, patientUpdateSchema, clinicalNotesSchema, vitalsSchema, profileUpdateSchema } = require('../validators').schemas;
const { info, error: logError, debug, warn } = require('../utils/logger');

/**
 * User Service
 * Static methods for user management business logic
 * 
 * Flow: [Controller] -> [Service] -> [Repository] -> [Database]
 */
class UserService {
  /**
   * Create a new patient
   * @param {Object} patientData - Patient creation data
   * @param {Object} req - Request object
   * @returns {Object} Patient creation result
   */
  static async createPatient(patientData, req) {
    const { error } = patientCreateSchema.validate(patientData);
    if (error) throw new BadRequestError(error.details[0].message, '4001');

    try {
      const userRepo = getUserRepository();
      const patientRepo = getPatientRepository();

      const { email, first_name, last_name, phone, password, user_id } = patientData;

      // Check if patient already exists
      if (email) {
        const existingUser = await userRepo.findByEmail(email);
        if (existingUser) {
          throw new ConflictError('Patient with this email already exists', '4091');
        }
      }

      // Use transaction for data consistency
      const result = await userRepo.transaction(async () => {
        let user;
        
        if (user_id) {
          // Link to existing user
          user = await userRepo.findById(user_id);
          if (!user) {
            throw new NotFoundError('User not found', '4041');
          }
        } else {
          // Create new user account
          user = await userRepo.createUser({
            email,
            password,
            role: 'patient',
            phone_number: phone,
            is_verified: false,
            phone_verified: false,
            status: 'active'
          });
        }

        // Create patient profile
        const patient = await patientRepo.createPatient({
          user_id: user.id,
          first_name,
          last_name,
          email: email || user.email,
          phone: phone || user.phone_number,
          status: 'active'
        });

        return { user, patient };
      });

      info(' Patient created:', { 
        patient_id: result.patient.id,
        user_id: result.user.id,
        name: `${first_name} ${last_name}`
      });

      return {
        user: {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          phone_number: result.user.phone_number,
          status: result.user.status
        },
        patient: {
          id: result.patient.id,
          first_name: result.patient.first_name,
          last_name: result.patient.last_name,
          full_name: `${result.patient.first_name} ${result.patient.last_name}`,
          email: result.patient.email,
          phone: result.patient.phone,
          status: result.patient.status
        }
      };

    } catch (error) {
      logError('Create patient service error:', error);
      if (error instanceof BadRequestError || error instanceof ConflictError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to create patient', '5001');
    }
  }

  /**
   * Get all patients with pagination
   * @param {Object} query - Query parameters for filtering and pagination
   * @returns {Object} Paginated patients list
   */
  static async getAllPatients(query = {}) {
    try {
      const patientRepo = getPatientRepository();
      
      const {
        page = 1,
        limit = 10,
        search,
        status = 'active',
        sort_by = 'created_at',
        sort_order = 'desc'
      } = query;

      const offset = (page - 1) * limit;

      const result = await patientRepo.findAllPatients({
        search,
        status,
        sort_by,
        sort_order,
        limit: parseInt(limit),
        offset
      });

      info(' Patients retrieved:', { 
        count: result.patients.length,
        total: result.total,
        page 
      });

      return {
        patients: result.patients.map(patient => ({
          id: patient.id,
          first_name: patient.first_name,
          last_name: patient.last_name,
          full_name: `${patient.first_name} ${patient.last_name}`,
          email: patient.email,
          phone: patient.phone,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          status: patient.status,
          created_at: patient.created_at,
          last_visit: patient.last_appointment_date
        })),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(result.total / limit),
          total_count: result.total,
          per_page: parseInt(limit),
          has_next: page * limit < result.total,
          has_prev: page > 1
        }
      };

    } catch (error) {
      logError('Get all patients service error:', error);
      throw new InternalServerError('Failed to retrieve patients', '5002');
    }
  }

  /**
   * Get patient by ID
   * @param {number} patientId - Patient ID
   * @returns {Object} Patient details
   */
  static async getPatientById(patientId) {
    try {
      const patientRepo = getPatientRepository();
      
      const patient = await patientRepo.findPatientById(patientId);
      if (!patient) {
        throw new NotFoundError('Patient not found', '4041');
      }

      info(' Patient retrieved:', { patient_id: patientId });

      return {
        id: patient.id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        full_name: `${patient.first_name} ${patient.last_name}`,
        email: patient.email,
        phone: patient.phone,
        date_of_birth: patient.date_of_birth,
        gender: patient.gender,
        marriage_status: patient.marriage_status,
        race: patient.race,
        address: patient.address,
        emergency_contact: patient.emergency_contact,
        insurance_provider: patient.insurance_provider,
        insurance_policy_number: patient.insurance_policy_number,
        status: patient.status,
        created_at: patient.created_at,
        updated_at: patient.updated_at,
        clinical_notes: patient.clinical_notes || [],
        vitals: patient.vitals || []
      };

    } catch (error) {
      logError('Get patient by ID service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to retrieve patient', '5003');
    }
  }

  /**
   * Update patient information
   * @param {number} patientId - Patient ID
   * @param {Object} updateData - Patient update data
   * @returns {Object} Updated patient
   */
  static async updatePatient(patientId, updateData) {
    const { error } = patientUpdateSchema.validate(updateData);
    if (error) throw new BadRequestError(error.details[0].message, '4001');

    try {
      const patientRepo = getPatientRepository();
      
      const existingPatient = await patientRepo.findPatientById(patientId);
      if (!existingPatient) {
        throw new NotFoundError('Patient not found', '4041');
      }

      const updatedPatient = await patientRepo.updatePatient(patientId, updateData);

      info(' Patient updated:', { patient_id: patientId });

      return {
        id: updatedPatient.id,
        first_name: updatedPatient.first_name,
        last_name: updatedPatient.last_name,
        full_name: `${updatedPatient.first_name} ${updatedPatient.last_name}`,
        email: updatedPatient.email,
        phone: updatedPatient.phone,
        date_of_birth: updatedPatient.date_of_birth,
        gender: updatedPatient.gender,
        marriage_status: updatedPatient.marriage_status,
        race: updatedPatient.race,
        address: updatedPatient.address,
        emergency_contact: updatedPatient.emergency_contact,
        insurance_provider: updatedPatient.insurance_provider,
        insurance_policy_number: updatedPatient.insurance_policy_number,
        status: updatedPatient.status,
        updated_at: updatedPatient.updated_at
      };

    } catch (error) {
      logError('Update patient service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to update patient', '5004');
    }
  }

  /**
   * Add clinical notes for a patient
   * @param {number} patientId - Patient ID
   * @param {Object} notesData - Clinical notes data
   * @returns {Object} Added notes
   */
  static async addClinicalNotes(patientId, notesData) {
    const { error } = clinicalNotesSchema.validate(notesData);
    if (error) throw new BadRequestError(error.details[0].message, '4001');

    try {
      const patientRepo = getPatientRepository();
      
      const patient = await patientRepo.findPatientById(patientId);
      if (!patient) {
        throw new NotFoundError('Patient not found', '4041');
      }

      const notes = await patientRepo.addClinicalNotes(patientId, notesData);

      info(' Clinical notes added:', { patient_id: patientId, notes_id: notes.id });

      return {
        id: notes.id,
        patient_id: notes.patient_id,
        notes: notes.notes,
        note_type: notes.note_type,
        created_by: notes.created_by,
        created_at: notes.created_at
      };

    } catch (error) {
      logError('Add clinical notes service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to add clinical notes', '5005');
    }
  }

  /**
   * Record patient vitals
   * @param {number} patientId - Patient ID
   * @param {Object} vitalsData - Vitals data
   * @returns {Object} Recorded vitals
   */
  static async recordVitals(patientId, vitalsData) {
    const { error } = vitalsSchema.validate(vitalsData);
    if (error) throw new BadRequestError(error.details[0].message, '4001');

    try {
      const patientRepo = getPatientRepository();
      
      const patient = await patientRepo.findPatientById(patientId);
      if (!patient) {
        throw new NotFoundError('Patient not found', '4041');
      }

      const vitals = await patientRepo.recordVitals(patientId, vitalsData);

      info(' Vitals recorded:', { patient_id: patientId, vitals_id: vitals.id });

      return {
        id: vitals.id,
        patient_id: vitals.patient_id,
        blood_pressure_systolic: vitals.blood_pressure_systolic,
        blood_pressure_diastolic: vitals.blood_pressure_diastolic,
        heart_rate: vitals.heart_rate,
        temperature: vitals.temperature,
        weight: vitals.weight,
        height: vitals.height,
        notes: vitals.notes,
        recorded_by: vitals.recorded_by,
        recorded_at: vitals.recorded_at
      };

    } catch (error) {
      logError('Record vitals service error:', error);
      if (error instanceof BadRequestError || error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to record vitals', '5006');
    }
  }

  /**
   * Get patient's clinical notes
   * @param {number} patientId - Patient ID
   * @returns {Array} Clinical notes
   */
  static async getClinicalNotes(patientId) {
    try {
      const patientRepo = getPatientRepository();
      
      const patient = await patientRepo.findPatientById(patientId);
      if (!patient) {
        throw new NotFoundError('Patient not found', '4041');
      }

      const notes = await patientRepo.getClinicalNotes(patientId);

      info(' Clinical notes retrieved:', { patient_id: patientId, count: notes.length });

      return notes.map(note => ({
        id: note.id,
        patient_id: note.patient_id,
        notes: note.notes,
        note_type: note.note_type,
        created_by: note.created_by,
        doctor_name: note.doctor_name,
        created_at: note.created_at
      }));

    } catch (error) {
      logError('Get clinical notes service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to retrieve clinical notes', '5007');
    }
  }

  /**
   * Get patient's vitals history
   * @param {number} patientId - Patient ID
   * @returns {Object} Vitals history
   */
  static async getVitalsHistory(patientId) {
    try {
      const patientRepo = getPatientRepository();
      
      const vitals = await patientRepo.findPatientVitals(patientId);

      info(' Vitals history retrieved:', { patient_id: patientId, count: vitals.length });

      return {
        vitals: vitals.map(vital => ({
          id: vital.id,
          blood_pressure: vital.blood_pressure,
          heart_rate: vital.heart_rate,
          temperature: vital.temperature,
          weight: vital.weight,
          height: vital.height,
          notes: vital.notes,
          recorded_at: vital.recorded_at,
          recorded_by: vital.recorded_by
        }))
      };

    } catch (error) {
      logError('Get vitals history service error:', error);
      throw new InternalServerError('Failed to retrieve vitals history', '5006');
    }
  }

  /**
   * Get current user's profile
   * @param {number} userId - User ID from JWT
   * @returns {Object} User profile data or placeholder
   */
  static async getProfile(userId) {
    try {
      const userRepo = getUserRepository();
      const patientRepo = getPatientRepository();
      
      // Get user data
      const user = await userRepo.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found', '4041');
      }

      // Get patient profile data
      const patient = await patientRepo.findByUserId(userId);
      
      if (!patient) {
        // Return placeholder data if no profile exists
        info('Profile not found, returning placeholder:', { user_id: userId });
        return {
          placeholder: true,
          data: {
            first_name: '',
            middle_name: '',
            last_name: '',
            date_of_birth: '',
            gender: '',
            marriage_status: '',
            race: '',
            phone: user.phone_number || '',
            email: user.email || '',
            street: '',
            city: '',
            state: '',
            zip: '',
            employer: '',
            occupation: '',
            work_address: '',
            work_phone: '',
            spouse_phone: '',
            emergency_contact_name: '',
            emergency_contact_phone: '',
            emergency_contact_relationship: ''
          }
        };
      }

      info('Profile retrieved:', { user_id: userId, patient_id: patient.id });

      return {
        placeholder: false,
        data: {
          first_name: patient.first_name || '',
          middle_name: patient.middle_name || '',
          last_name: patient.last_name || '',
          date_of_birth: patient.date_of_birth || '',
          gender: patient.gender || '',
          marriage_status: patient.marriage_status || '',
          race: patient.race || '',
          phone: patient.phone || user.phone_number || '',
          email: patient.email || user.email || '',
          street: patient.street || '',
          city: patient.city || '',
          state: patient.state || '',
          zip: patient.zip || '',
          employer: patient.employer || '',
          occupation: patient.occupation || '',
          work_address: patient.work_address || '',
          work_phone: patient.work_phone || '',
          spouse_phone: patient.spouse_phone || '',
          emergency_contact_name: patient.emergency_contact_name || '',
          emergency_contact_phone: patient.emergency_contact_phone || '',
          emergency_contact_relationship: patient.emergency_contact_relationship || ''
        }
      };

    } catch (error) {
      logError('Get profile service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to retrieve profile', '5007');
    }
  }

  /**
   * Update current user's profile
   * @param {number} userId - User ID from JWT
   * @param {Object} profileData - Profile update data
   * @returns {Object} Updated profile data
   */
  static async updateProfile(userId, profileData) {
    try {
      const userRepo = getUserRepository();
      const patientRepo = getPatientRepository();
      
      // Get user data
      const user = await userRepo.findById(userId);
      if (!user) {
        throw new NotFoundError('User not found', '4041');
      }

      // Validate profile data
      const { error, value } = profileUpdateSchema.validate(profileData);
      if (error) {
        throw new BadRequestError(error.details[0].message, '4001');
      }

      const filteredData = value;

      // Add timestamps
      filteredData.updated_at = new Date();

      // Use transaction for data consistency
      const result = await userRepo.transaction(async () => {
        // Check if patient profile exists
        let patient = await patientRepo.findByUserId(userId);
        
        if (!patient) {
          // Create new patient profile
          patient = await patientRepo.createPatient({
            user_id: userId,
            ...filteredData,
            status: 'active',
            created_at: new Date()
          });
        } else {
          // Update existing patient profile
          patient = await patientRepo.updatePatient(patient.id, filteredData);
        }

        // Update user table if email or phone changed
        const userUpdates = {};
        if (filteredData.email && filteredData.email !== user.email) {
          userUpdates.email = filteredData.email;
        }
        if (filteredData.phone && filteredData.phone !== user.phone_number) {
          userUpdates.phone_number = filteredData.phone;
        }

        if (Object.keys(userUpdates).length > 0) {
          userUpdates.updated_at = new Date();
          await userRepo.updateById(userId, userUpdates);
        }

        return patient;
      });

      info('Profile updated:', { user_id: userId, patient_id: result.id });

      return {
        placeholder: false,
        data: {
          first_name: result.first_name || '',
          middle_name: result.middle_name || '',
          last_name: result.last_name || '',
          date_of_birth: result.date_of_birth || '',
          gender: result.gender || '',
          marriage_status: result.marriage_status || '',
          race: result.race || '',
          phone: result.phone || '',
          email: result.email || '',
          street: result.street || '',
          city: result.city || '',
          state: result.state || '',
          zip: result.zip || '',
          employer: result.employer || '',
          occupation: result.occupation || '',
          work_address: result.work_address || '',
          work_phone: result.work_phone || '',
          spouse_phone: result.spouse_phone || '',
          emergency_contact_name: result.emergency_contact_name || '',
          emergency_contact_phone: result.emergency_contact_phone || '',
          emergency_contact_relationship: result.emergency_contact_relationship || ''
        }
      };

    } catch (error) {
      logError('Update profile service error:', error);
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new InternalServerError('Failed to update profile', '5008');
    }
  }
}

module.exports = UserService; 