const Joi = require('joi');

// Validator for creating a user profile


const createProfileValidator = {
  validate(data) {
    if (!data || typeof data !== 'object') {
      return { error: { details: [{ message: 'invalid payload' }] } };
    }
    const {
      emergency_contact,
      insurance_detail,
      pain_descriptions = [],
      ...profile
    } = data;
    if (!profile.home_addr || !profile.city || !profile.zip || !profile.home_phone) {
      return { error: { details: [{ message: 'missing profile fields' }] } };
    }
    if (!emergency_contact || !emergency_contact.name || !emergency_contact.phone) {
      return { error: { details: [{ message: 'invalid emergency contact' }] } };
    }
    if (!insurance_detail || !insurance_detail.insurance_type) {
      return { error: { details: [{ message: 'invalid insurance detail' }] } };
    }
    return { value: { profile, emergency_contact, insurance_detail, pain_descriptions } };
  }
};


module.exports = {
  createProfileValidator,
};
