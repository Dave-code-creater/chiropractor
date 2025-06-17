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
  last_name: joi.string().alphanum().min(2).required(),
});

const signInValidator = joi.object({
  email: joi.string().email().required(),
  password: joi.string().min(8).required(),
});

module.exports = { signUpValidator, signInValidator };