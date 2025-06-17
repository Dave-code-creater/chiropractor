// src/validators/access.js
const joi = require('joi');

const signUpValidator = joi.object({
  email: joi.string().email().required(),
  password: joi.string()
    .min(8)
    .pattern(/[a-zA-Z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]+/)
    .message('password must be at least 8 chars and contain only letters, numbers or symbols')
    .required(),
  first_name: joi.string().alphanum().min(2).required(),
  phone_number: joi.string().pattern(/^\+?[1-9]\d{1,14}$/),
  last_name: joi.string().alphanum().min(2).required(),
  confirm_password: joi.string().valid(joi.ref('password')).required().messages({
    'any.only': 'confirm_password must match password'
  })
});

const signInValidator = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(8).required(),
});

module.exports = { signUpValidator, signInValidator };