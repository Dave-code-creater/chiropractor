const createEmergencyContactValidator = {
  validate(data) {
    if (!data || typeof data !== 'object') {
      return { error: { details: [{ message: 'invalid payload' }] } };
    }
    const { emergency_contact = {} } = data;
    return { value: { emergency_contact } };
  }
};

module.exports = { createEmergencyContactValidator };
