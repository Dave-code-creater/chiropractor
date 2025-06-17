const joi = require('joi');

const createProfileValidator = joi.object({
  first_name: joi.string().required(),
  last_name: joi.string().required(),
  middle_name: joi.string().optional(),
  day_of_birth: joi.number().integer().min(1).max(31).required(),
  gender: joi.string()
    .valid('Male', 'Female', 'Other')
    .required(),
  month_of_birth: joi.string().valid(
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ).required(),
  year_of_birth: joi.string()
    .pattern(/^\d{4}$/)
    .required(),
  street_address: joi.string().required(),
  city: joi.string().required(),
  state: joi.string().required(),
  zip_code: joi.string().required(),
  country: joi.string().required(),
  emergency_contact_name: joi.string().required(),
  emergency_contact_phone: joi.string().pattern(/^\+?[1-9]\d{1,14}$/).required(),
  emergency_contact_relationship: joi.string().required(),
})


module.exports = createProfileValidator;
