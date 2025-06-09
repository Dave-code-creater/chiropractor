const createProfileValidator = {
  validate(data) {
    if (!data || typeof data !== 'object') {
      return { error: { details: [{ message: 'invalid payload' }] } };
    }
    const { emergency_contact = {}, insurance_detail = {}, ...profile } = data;
    return { value: { profile, emergency_contact, insurance_detail } };
  }
};

module.exports = { createProfileValidator };
