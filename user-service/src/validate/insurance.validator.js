const createInsuranceDetailValidator = {
  validate(data) {
    if (!data || typeof data !== 'object') {
      return { error: { details: [{ message: 'invalid payload' }] } };
    }
    const { insurance_detail = {} } = data;
    return { value: { insurance_detail } };
  }
};

module.exports = { createInsuranceDetailValidator };
