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
    .pattern(/^[\+]?[1-9][\d\s\-\(\)]{7,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number',
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
  first_name: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'First name can only contain letters and spaces'
    }),
  
  last_name: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Last name can only contain letters and spaces'
    }),
  
  phone_number: Joi.string()
    .pattern(/^[\+]?[1-9][\d]{0,15}$/)
    .required()
    .messages({
      'string.pattern.base': 'Phone number must be a valid format'
    }),
  
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .lowercase()
    .required()
    .messages({
      'string.email': 'Please provide a valid email address'
    }),
  
  password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  
  confirm_password: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match'
    }),

  role: Joi.string()
    .valid('patient', 'doctor', 'staff', 'admin')
    .default('patient'),

  // Optional fields for doctor registration
  specialization: Joi.string()
    .min(2)
    .max(100)
    .when('role', {
      is: 'doctor',
      then: Joi.required(),
      otherwise: Joi.optional()
    }),

  license_number: Joi.string()
    .alphanum()
    .min(5)
    .max(20)
    .when('role', {
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