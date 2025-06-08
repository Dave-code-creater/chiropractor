import {
  createProfile,
  getProfileById,
  updateProfile,
  createEmergencyContact,
  getEmergencyContactById,
  updateEmergencyContact,
  createInsuranceDetail,
  getInsuranceDetailById,
  updateInsuranceDetail
} from '../repositories/index.repo.js';

export default class UserService {
  static async createProfile(data) {
    return createProfile(data);
  }

  static async getProfile(id) {
    return getProfileById(id);
  }

  static async updateProfile(id, data) {
    return updateProfile(id, data);
  }

  static async createEmergencyContact(data) {
    return createEmergencyContact(data);
  }

  static async getEmergencyContact(id) {
    return getEmergencyContactById(id);
  }

  static async updateEmergencyContact(id, data) {
    return updateEmergencyContact(id, data);
  }

  static async createInsuranceDetail(data) {
    return createInsuranceDetail(data);
  }

  static async getInsuranceDetail(id) {
    return getInsuranceDetailById(id);
  }

  static async updateInsuranceDetail(id, data) {
    return updateInsuranceDetail(id, data);
  }
}
