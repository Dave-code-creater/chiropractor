const createProfileValidator = {
  validate(data) {
    if (!data || typeof data !== 'object') {
      return { error: { details: [{ message: 'invalid payload' }] } };
    }
    const { emergency_contact = {}, insurance_detail = {}, ...profile } = data;
    return { value: { profile, emergency_contact, insurance_detail } };
  }
};

const createEmergencyContactValidator = {
  validate(data) {
    if (!data || typeof data !== 'object') {
      return { error: { details: [{ message: 'invalid payload' }] } };
    }
    const { emergency_contact = {} } = data;
    return { value: { emergency_contact } };
  }
};

const createInsuranceDetailValidator = {
  validate(data) {
    if (!data || typeof data !== 'object') {
      return { error: { details: [{ message: 'invalid payload' }] } };
    }
    const { insurance_detail = {} } = data;
    return { value: { insurance_detail } };
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
  createEmergencyContactValidator,
  createInsuranceDetailValidator,
  createPainEvaluationValidator,
  createImpactValidator,
  createHealthHistoryValidator
};
