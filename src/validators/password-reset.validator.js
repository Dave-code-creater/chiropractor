const Joi = require('joi');

// Password reset validation schemas - using snake_case for consistency
const passwordResetRequestSchema = Joi.object({
  email: Joi.string().email().required()
});

const verifyResetTokenSchema = Joi.object({
  token: Joi.string().uuid().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().uuid().required(),
  new_password: Joi.string().min(8).required(),
  confirm_password: Joi.string().valid(Joi.ref('new_password')).required()
});

module.exports = {
  passwordResetRequestSchema,
  verifyResetTokenSchema,
  resetPasswordSchema
}; 