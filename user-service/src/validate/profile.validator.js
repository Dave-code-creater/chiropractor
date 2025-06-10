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


const createPainEvaluationValidator = {
  validate(data) {
    if (!data || typeof data !== 'object') {
      return { error: { details: [{ message: 'invalid payload' }] } };
    }
    const { pain_evaluation = {} } = data;
    return { value: { pain_evaluation } };
  }
};

const createImpactValidator = {
  validate(data) {
    if (!data || typeof data !== 'object') {
      return { error: { details: [{ message: 'invalid payload' }] } };
    }
    const { impact = {} } = data;
    return { value: { impact } };
  }
};

const createHealthHistoryValidator = {
  validate(data) {
    if (!data || typeof data !== 'object') {
      return { error: { details: [{ message: 'invalid payload' }] } };
    }
    const { health_history = {} } = data;
    return { value: { health_history } };
  }
};

module.exports = {
  createProfileValidator,
  createPainEvaluationValidator,
  createImpactValidator,
  createHealthHistoryValidator
};
