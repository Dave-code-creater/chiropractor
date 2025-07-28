const BaseRepository = require('./base.repository');
const UserRepository = require('./user.repository');
const PatientRepository = require('./patient.repository');
const DoctorRepository = require('./doctor.repository');
const ApiKeyRepository = require('./api-key.repository');
const AppointmentRepository = require('./appointment.repository');
const ChatRepository = require('./chat.repository');

/**
 * Repository Factory
 * Provides singleton instances of repositories
 */
class RepositoryFactory {
  constructor() {
    this._instances = new Map();
  }

  /**
   * Get repository instance (singleton pattern)
   * @param {string} repositoryName - Repository name
   * @returns {BaseRepository} Repository instance
   */
  getRepository(repositoryName) {
    if (!this._instances.has(repositoryName)) {
      switch (repositoryName.toLowerCase()) {
        case 'user':
        case 'users':
          this._instances.set(repositoryName, new UserRepository());
          break;
        case 'patient':
        case 'patients':
          this._instances.set(repositoryName, new PatientRepository());
          break;
        case 'doctor':
        case 'doctors':
          this._instances.set(repositoryName, new DoctorRepository());
          break;
        case 'apikey':
        case 'api_key':
        case 'api_keys':
          this._instances.set(repositoryName, new ApiKeyRepository());
          break;
        case 'appointment':
        case 'appointments':
          this._instances.set(repositoryName, new AppointmentRepository());
          break;
        case 'chat':
        case 'chats':
          this._instances.set(repositoryName, new ChatRepository());
          break;
        default:
          throw new Error(`Repository '${repositoryName}' not found`);
      }
    }

    return this._instances.get(repositoryName);
  }

  /**
   * Get user repository
   * @returns {UserRepository} User repository instance
   */
  getUserRepository() {
    return this.getRepository('user');
  }

  /**
   * Get patient repository
   * @returns {PatientRepository} Patient repository instance
   */
  getPatientRepository() {
    return this.getRepository('patient');
  }

  /**
   * Get doctor repository
   * @returns {DoctorRepository} Doctor repository instance
   */
  getDoctorRepository() {
    return this.getRepository('doctor');
  }

  /**
   * Get API key repository
   * @returns {ApiKeyRepository} API key repository instance
   */
  getApiKeyRepository() {
    return this.getRepository('apikey');
  }

  /**
   * Get appointment repository
   * @returns {AppointmentRepository} Appointment repository instance
   */
  getAppointmentRepository() {
    return this.getRepository('appointment');
  }

  /**
   * Get chat repository
   * @returns {ChatRepository} Chat repository instance
   */
  getChatRepository() {
    return this.getRepository('chat');
  }

  /**
   * Clear all repository instances (useful for testing)
   */
  clearInstances() {
    this._instances.clear();
  }
}

// Create singleton factory instance
const repositoryFactory = new RepositoryFactory();

// Export individual repository classes
module.exports = {
  // Base repository
  BaseRepository,

  // Specific repositories
  UserRepository,
  PatientRepository,
  DoctorRepository,
  ApiKeyRepository,
  AppointmentRepository,
  ChatRepository,

  // Factory instance
  repositoryFactory,

  // Convenience methods for getting repositories
  getUserRepository: () => repositoryFactory.getUserRepository(),
  getPatientRepository: () => repositoryFactory.getPatientRepository(),
  getDoctorRepository: () => repositoryFactory.getDoctorRepository(),
  getApiKeyRepository: () => repositoryFactory.getApiKeyRepository(),
  getAppointmentRepository: () => repositoryFactory.getAppointmentRepository(),
  getChatRepository: () => repositoryFactory.getChatRepository(),

  // Get repository by name
  getRepository: (name) => repositoryFactory.getRepository(name)
}; 