const Joi = require('joi');

// Authentication validation schemas - using snake_case for consistency
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  confirm_password: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': 'Passwords do not match'
  }),
  first_name: Joi.string().min(2).max(50).required(),
  last_name: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('doctor', 'staff', 'patient').default('patient'),
  specialization: Joi.string().max(100).optional(),
  license_number: Joi.string().max(50).optional(),
  phone_number: Joi.string().max(20).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

module.exports = {
  registerSchema,
  loginSchema
}; 