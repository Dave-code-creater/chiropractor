const Joi = require('joi');

/**
 * Authentication Validation Schemas
 * Used by validation middleware to validate requests before reaching controllers
 */

// Patient Registration Schema - matches the frontend form
const patientRegisterSchema = Joi.object({
  first_name: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'First name can only contain letters, spaces, apostrophes, and hyphens',
      'string.empty': 'First name is required',
      'any.required': 'First name is required'
    }),
  
  last_name: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Last name can only contain letters, spaces, apostrophes, and hyphens',
      'string.empty': 'Last name is required',
      'any.required': 'Last name is required'
    }),
  
  phone_number: Joi.string()
    .min(10)
    .max(20)
    .required()
    .messages({
      'string.min': 'Phone number must be at least 10 characters',
      'string.max': 'Phone number cannot exceed 20 characters',
      'string.empty': 'Phone number is required',
      'any.required': 'Phone number is required'
    }),
  
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address',
      'string.empty': 'Email address is required',
      'any.required': 'Email address is required'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'string.min': 'Password must be at least 8 characters long',
      'string.empty': 'Password is required',
      'any.required': 'Password is required'
    }),
  
  confirm_password: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'string.empty': 'Please confirm your password',
      'any.required': 'Please confirm your password'
    })
});

// General registration schema (for doctors and staff)
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  role: Joi.string().valid('patient', 'doctor', 'staff', 'admin').default('patient'),
  first_name: Joi.string().min(2).max(50).required(),
  last_name: Joi.string().min(2).max(50).required(),
  phone_number: Joi.string().min(10).max(20).optional(),
  specialization: Joi.string().when('role', {
    is: 'doctor',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    }),

  remember_me: Joi.boolean().default(false)
});

const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string().optional() // Token usually comes from headers
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  confirm_new_password: Joi.string()
    .valid(Joi.ref('new_password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match'
    })
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  new_password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required(),
  confirm_new_password: Joi.string()
    .valid(Joi.ref('new_password'))
    .required()
});

module.exports = {
  patientRegisterSchema,
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema
}; 