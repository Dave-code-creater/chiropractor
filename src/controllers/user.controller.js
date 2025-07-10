const { 
  PatientCreatedSuccess, 
  PatientsRetrievedSuccess, 
  SuccessResponse 
} = require('../utils/httpResponses');
const UserService = require('../services/UserService');

/**
 * User Controller
 * Static methods that handle HTTP concerns and delegate business logic to UserService
 * 
 * Flow: [Routing] -> [Controller] -> [Service] -> [Repository] -> [Database]
 */
class UserController {
  /**
   * Create a new patient
   * POST /api/users/patients
   */
  static async createPatient(req, res) {
    const patient = await UserService.createPatient(req.body, req);
    return new PatientCreatedSuccess({ metadata: patient }).send(res);
  }

  /**
   * Get all patients
   * GET /api/users/patients
   */
  static async getAllPatients(req, res) {
    const patients = await UserService.getAllPatients(req.query);
    return new PatientsRetrievedSuccess({ metadata: patients }).send(res);
  }

  /**
   * Get patient by ID
   * GET /api/users/patients/:id
   */
  static async getPatientById(req, res) {
    const patient = await UserService.getPatientById(req.params.id);
    return new SuccessResponse('Patient retrieved successfully', 200, patient).send(res);
  }

  /**
   * Update patient
   * PUT /api/users/patients/:id
   */
  static async updatePatient(req, res) {
    const patient = await UserService.updatePatient(req.params.id, req.body);
    return new SuccessResponse('Patient updated successfully', 200, patient).send(res);
  }

  /**
   * Add clinical notes
   * POST /api/users/patients/:id/clinical-notes
   */
  static async addClinicalNotes(req, res) {
    const notes = await UserService.addClinicalNotes(req.params.id, req.body);
    return new SuccessResponse('Clinical notes added successfully', 201, notes).send(res);
  }

  /**
   * Record patient vitals
   * POST /api/users/patients/:id/vitals
   */
  static async recordVitals(req, res) {
    const vitals = await UserService.recordVitals(req.params.id, req.body);
    return new SuccessResponse('Vitals recorded successfully', 201, vitals).send(res);
  }

  /**
   * Get clinical notes
   * GET /api/users/patients/:id/clinical-notes
   */
  static async getClinicalNotes(req, res) {
    const notes = await UserService.getClinicalNotes(req.params.id);
    return new SuccessResponse('Clinical notes retrieved successfully', 200, notes).send(res);
  }

  /**
   * Get vitals history
   * GET /api/users/patients/:id/vitals
   */
  static async getVitalsHistory(req, res) {
    const vitals = await UserService.getVitalsHistory(req.params.id);
    return new SuccessResponse('Vitals history retrieved successfully', 200, vitals).send(res);
  }

  /**
   * Get current user's profile
   * GET /api/users/profile
   */
  static async getProfile(req, res) {
    const profile = await UserService.getProfile(req.user.id);
    return new SuccessResponse('Profile retrieved successfully', 200, profile).send(res);
  }

  /**
   * Update current user's profile
   * PUT /api/users/profile
   */
  static async updateProfile(req, res) {
    const profile = await UserService.updateProfile(req.user.id, req.body);
    return new SuccessResponse('Profile updated successfully', 200, profile).send(res);
  }
}

module.exports = UserController; 